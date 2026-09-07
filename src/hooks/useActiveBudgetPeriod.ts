/**
 * React-query hook returning the currently active pay-period budget plus
 * per-parent-category spent-vs-budgeted numbers.
 *
 * "Active" = most recent budget_periods row in `displayCurrency` whose
 * period_end + 3-day grace >= today. Grace window only affects visibility;
 * `spent` still aggregates transactions strictly within [period_start,
 * period_end] so the last period's numbers don't grow after it ends.
 *
 * Spent-side normalizes cross-currency transactions to the period's currency
 * via CurrencyService.convert — same shape as buildCategoryHierarchy.
 */

import { useQuery } from "@tanstack/react-query";
import { addDays, formatISO, isAfter, isBefore, parseISO } from "date-fns";

import { CurrencyService } from "@/core/currency/CurrencyService";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Currency, Transaction } from "@/types";
import {
  PARENT_CATEGORY_IDS,
  type ParentCategoryId,
} from "@/utils/budget/defaults";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import {
  PARENT_CATEGORIES,
  SUBCATEGORY_TO_PARENT,
} from "@/utils/constants/categories";

const GRACE_DAYS = 3;

export interface BudgetPeriodRow {
  id: string;
  income_id: string;
  currency: Currency;
  period_start: string; // "YYYY-MM-DD"
  period_end: string; // "YYYY-MM-DD"
  salary_amount: number;
  allocations: Record<string, number>;
}

export interface AllocationLine {
  parentId: ParentCategoryId;
  name: string;
  icon: string;
  color: string;
  budgeted: number;
  spent: number;
  remaining: number;
  pctUsed: number; // 0..∞ (may exceed 100 when overspent)
}

export interface UseActiveBudgetPeriodResult {
  period: BudgetPeriodRow | null;
  allocations: AllocationLine[];
  totalBudgeted: number;
  totalSpent: number;
  isInGracePeriod: boolean;
  isLoading: boolean;
}

export const activeBudgetPeriodKey = (
  userId: string | undefined,
  displayCurrency: Currency
) => ["budget_periods", userId ?? "anon", displayCurrency] as const;

export function useActiveBudgetPeriod(
  displayCurrency: Currency,
  transactions: Transaction[] = []
): UseActiveBudgetPeriodResult {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: activeBudgetPeriodKey(user?.id, displayCurrency),
    queryFn: async (): Promise<BudgetPeriodRow | null> => {
      if (!user?.id) return null;
      // Filter server-side: only rows in the right currency where
      // period_end + grace hasn't passed. Sort by period_start desc so the
      // most recent salary wins when two overlap.
      const cutoff = formatISO(addDays(new Date(), -GRACE_DAYS), {
        representation: "date",
      });
      const { data, error } = await supabase
        .from("budget_periods")
        .select(
          "id, income_id, currency, period_start, period_end, salary_amount, allocations"
        )
        .eq("user_id", user.id)
        .eq("currency", displayCurrency)
        .gte("period_end", cutoff)
        .order("period_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        income_id: data.income_id,
        currency: data.currency as Currency,
        period_start: data.period_start,
        period_end: data.period_end,
        salary_amount: Number(data.salary_amount),
        allocations: (data.allocations as Record<string, number>) ?? {},
      };
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const period = query.data ?? null;

  // Aggregate spent per parent for the period.
  const spentByParent = aggregateSpent(period, transactions, displayCurrency);

  const allocations: AllocationLine[] = PARENT_CATEGORIES.map((p) => {
    const budgeted = period?.allocations?.[p.id] ?? 0;
    const spent = spentByParent[p.id as ParentCategoryId] ?? 0;
    const remaining = budgeted - spent;
    const pctUsed =
      budgeted > 0 ? (spent / budgeted) * 100 : spent > 0 ? Infinity : 0;
    return {
      parentId: p.id as ParentCategoryId,
      name: p.name,
      icon: p.icon,
      color: p.color,
      budgeted,
      spent,
      remaining,
      pctUsed,
    };
  });

  const totalBudgeted = allocations.reduce((s, a) => s + a.budgeted, 0);
  const totalSpent = allocations.reduce((s, a) => s + a.spent, 0);

  const isInGracePeriod =
    !!period && isAfter(new Date(), parseISO(period.period_end));

  return {
    period,
    allocations,
    totalBudgeted,
    totalSpent,
    isInGracePeriod,
    isLoading: query.isLoading,
  };
}

// -----------------------------------------------------------------------------
// helpers

function aggregateSpent(
  period: BudgetPeriodRow | null,
  transactions: Transaction[],
  displayCurrency: Currency
): Record<ParentCategoryId, number> {
  const zero = Object.fromEntries(
    PARENT_CATEGORY_IDS.map((id) => [id, 0])
  ) as Record<ParentCategoryId, number>;
  if (!period) return zero;

  const start = parseISO(period.period_start);
  const endExclusive = addDays(parseISO(period.period_end), 1);

  for (const tx of transactions) {
    const rawDate = tx.date;
    if (!rawDate) continue;
    const txDate =
      typeof rawDate === "string" ? parseISO(rawDate.slice(0, 10)) : rawDate;
    if (isBefore(txDate, start) || !isBefore(txDate, endExclusive)) continue;

    const category = getEffectiveCategory(tx);
    const parentConfig = SUBCATEGORY_TO_PARENT[category];
    const parentId = ((parentConfig as { id?: string } | undefined)?.id ??
      "financial_other") as ParentCategoryId;

    const gross = tx.amount;
    const reimbursement = tx.reimbursementAmount || 0;
    const net = gross - reimbursement;

    let amount = net;
    if (tx.currency !== displayCurrency) {
      try {
        amount = CurrencyService.convert(
          net,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
      } catch {
        // Fall back to raw net if conversion fails.
      }
    }
    zero[parentId] = (zero[parentId] ?? 0) + amount;
  }
  return zero;
}
