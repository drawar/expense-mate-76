/**
 * React-query hook returning the currently active pay-period budget plus
 * per-parent-category spent-vs-budgeted numbers.
 *
 * Cadence-aware:
 *   - `per_period` categories → budget from current period's snapshot, spend
 *     scoped to [period_start, period_end]
 *   - `monthly` categories    → budget summed across every period
 *     overlapping the current period's calendar month, spend accumulated
 *     across the whole calendar month
 *
 * The `period` value returned always represents the current pay period
 * (used for the "Save first" strip, ends-date, and total-budget math).
 * Per-row `budgeted`/`spent`/`window` reflect that row's cadence.
 *
 * Spent-side normalizes cross-currency transactions to the period's currency
 * via CurrencyService.convert — same shape as buildCategoryHierarchy.
 */

import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  endOfMonth,
  formatISO,
  isBefore,
  parseISO,
  startOfMonth,
} from "date-fns";

import { CurrencyService } from "@/core/currency/CurrencyService";
import { useAuth } from "@/hooks/useAuth";
import { useBudgetAllocations } from "@/hooks/useBudgetAllocations";
import { calcWindowBudgetForKey } from "@/hooks/useMonthlyBudgetTarget";
import { supabase } from "@/integrations/supabase/client";
import type { Currency, Transaction } from "@/types";
import {
  DEFAULT_CADENCE,
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type Cadence,
  type ParentCategoryId,
} from "@/utils/budget/defaults";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import {
  PARENT_CATEGORIES,
  SUBCATEGORY_TO_PARENT,
} from "@/utils/constants/categories";

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
  cadence: Cadence;
  budgeted: number;
  spent: number;
  remaining: number;
  pctUsed: number; // 0..∞ (may exceed 100 when overspent)
  /** Which window the numbers cover — "This period" or "This month". */
  windowLabel: string;
}

export interface UseActiveBudgetPeriodResult {
  period: BudgetPeriodRow | null;
  allocations: AllocationLine[];
  /** Pay-yourself-first savings amount snapshotted from period.allocations.savings; 0 for legacy rows. */
  savingsBudgeted: number;
  /** salary_amount − savingsBudgeted; the pot that funds the six category budgets. */
  remainingToSpend: number;
  /** Sum of the six per-parent-category budgets (does NOT include savings). */
  totalBudgeted: number;
  /** Sum of actual spend across the six spending categories (does NOT include savings). */
  totalSpent: number;
  /**
   * Sum of all spending in [period_start, period_end] regardless of category cadence.
   * Use this for paycheck-scoped math ("did I burn through this paycheck?") — it
   * excludes the monthly-essentials tail from the previous period that
   * `totalSpent` picks up when Essentials/Home & Living are on `monthly` cadence.
   */
  periodOnlyTotalSpent: number;
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
  const { cadence } = useBudgetAllocations();

  const activePeriodQuery = useQuery({
    queryKey: activeBudgetPeriodKey(user?.id, displayCurrency),
    queryFn: async (): Promise<BudgetPeriodRow | null> => {
      if (!user?.id) return null;
      const cutoff = formatISO(new Date(), { representation: "date" });
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

  const period = activePeriodQuery.data ?? null;

  // Calendar month bounds — anchored on the current period's start so a
  // period spanning two months still resolves to one meaningful month.
  const monthStartISO = period
    ? formatISO(startOfMonth(parseISO(period.period_start)), {
        representation: "date",
      })
    : null;
  const monthEndISO = period
    ? formatISO(endOfMonth(parseISO(period.period_start)), {
        representation: "date",
      })
    : null;

  // For monthly-cadence categories, sum PRORATED budgets across all periods
  // overlapping the calendar month — each period contributes proportional to
  // the days that fall inside the month, so a period straddling a month
  // boundary doesn't double-count on both sides.
  const monthPeriodsQuery = useQuery({
    queryKey: [
      "budget_periods_month",
      user?.id ?? "anon",
      displayCurrency,
      monthStartISO,
      monthEndISO,
    ] as const,
    queryFn: async (): Promise<
      Array<
        Pick<BudgetPeriodRow, "period_start" | "period_end" | "allocations">
      >
    > => {
      if (!user?.id || !monthStartISO || !monthEndISO) return [];
      const { data, error } = await supabase
        .from("budget_periods")
        .select("period_start, period_end, allocations")
        .eq("user_id", user.id)
        .eq("currency", displayCurrency)
        .lte("period_start", monthEndISO)
        .gte("period_end", monthStartISO);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        period_start: row.period_start,
        period_end: row.period_end,
        allocations: (row.allocations as Record<string, number>) ?? {},
      }));
    },
    enabled: !!user?.id && !!monthStartISO,
    staleTime: 30 * 1000,
  });

  const monthPeriods = monthPeriodsQuery.data ?? [];

  // Aggregate spent per parent × cadence window.
  const perPeriodSpent = aggregateSpent(
    period ? { start: period.period_start, end: period.period_end } : null,
    transactions,
    displayCurrency
  );
  const monthlySpent = aggregateSpent(
    monthStartISO && monthEndISO
      ? { start: monthStartISO, end: monthEndISO }
      : null,
    transactions,
    displayCurrency
  );

  const allocations: AllocationLine[] = PARENT_CATEGORIES.map((p) => {
    const parentId = p.id as ParentCategoryId;
    const cat = cadence[parentId] ?? DEFAULT_CADENCE[parentId];
    let budgeted: number;
    let spent: number;
    let windowLabel: string;
    if (cat === "monthly") {
      budgeted =
        monthStartISO && monthEndISO
          ? calcWindowBudgetForKey(
              monthPeriods,
              monthStartISO,
              monthEndISO,
              parentId
            )
          : 0;
      spent = monthlySpent[parentId] ?? 0;
      windowLabel = "This month";
    } else {
      budgeted = period?.allocations?.[parentId] ?? 0;
      spent = perPeriodSpent[parentId] ?? 0;
      windowLabel = "This period";
    }
    const remaining = budgeted - spent;
    const pctUsed =
      budgeted > 0 ? (spent / budgeted) * 100 : spent > 0 ? Infinity : 0;
    return {
      parentId,
      name: p.name,
      icon: p.icon,
      color: p.color,
      cadence: cat,
      budgeted,
      spent,
      remaining,
      pctUsed,
      windowLabel,
    };
  });

  const totalBudgeted = allocations.reduce((s, a) => s + a.budgeted, 0);
  const totalSpent = allocations.reduce((s, a) => s + a.spent, 0);
  // Paycheck-scoped spend: all categories, always in [period_start, period_end].
  // Independent of cadence — the paycheck question is "what did this pay period
  // burn?", not "what did each budget bucket burn in its own window?".
  const periodOnlyTotalSpent = PARENT_CATEGORY_IDS.reduce(
    (s, id) => s + (perPeriodSpent[id] ?? 0),
    0
  );

  const savingsBudgeted = period?.allocations?.[SAVINGS_ID] ?? 0;
  const remainingToSpend = period ? period.salary_amount - savingsBudgeted : 0;

  return {
    period,
    allocations,
    savingsBudgeted,
    remainingToSpend,
    totalBudgeted,
    totalSpent,
    periodOnlyTotalSpent,
    isLoading: activePeriodQuery.isLoading || monthPeriodsQuery.isLoading,
  };
}

// -----------------------------------------------------------------------------
// helpers

interface DateWindow {
  start: string; // yyyy-MM-dd inclusive
  end: string; // yyyy-MM-dd inclusive
}

function aggregateSpent(
  window: DateWindow | null,
  transactions: Transaction[],
  displayCurrency: Currency
): Record<ParentCategoryId, number> {
  const zero = Object.fromEntries(
    PARENT_CATEGORY_IDS.map((id) => [id, 0])
  ) as Record<ParentCategoryId, number>;
  if (!window) return zero;

  const start = parseISO(window.start);
  const endExclusive = addDays(parseISO(window.end), 1);

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
