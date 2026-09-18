/**
 * Aggregate spending budgets for any calendar window from the underlying
 * pay-period snapshots in `budget_periods`.
 *
 * Each period covers a variable-length pay-period window (biweekly = 14d,
 * semi-monthly = 14–17d, monthly = ~30d). For a calendar window like a
 * month, the target = sum of each overlapping period's spending budget
 * PRORATED by the fraction of days that fall inside the window.
 *
 * Savings is NOT included — this returns the spending budget only, matching
 * useActiveBudgetPeriod.totalBudgeted for single-period cases.
 *
 * Used by the SpendingOverviewCard target line and the useForecast budget
 * input, both of which show calendar-month views but need honest monthly
 * targets rather than a single pay-period's number.
 */

import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parseISO } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Currency } from "@/types";
import { SAVINGS_ID } from "@/utils/budget/defaults";

export interface BudgetPeriodSlim {
  period_start: string;
  period_end: string;
  allocations: Record<string, number>;
}

function spendingBudgetOf(allocations: Record<string, number> | null): number {
  if (!allocations) return 0;
  let sum = 0;
  for (const [key, value] of Object.entries(allocations)) {
    if (key === SAVINGS_ID) continue;
    sum += Number(value) || 0;
  }
  return sum;
}

/**
 * Sum prorated spending budgets across every budget_periods row that
 * overlaps [from, to] (both inclusive, "YYYY-MM-DD"). Exposed for testing
 * and reuse. Returns 0 when the input is empty.
 */
export function calcWindowBudget(
  periods: readonly BudgetPeriodSlim[],
  from: string,
  to: string
): number {
  return calcWindowBudgetFor(periods, from, to, (a) => spendingBudgetOf(a));
}

/**
 * Prorated aggregation of a single allocation key across overlapping periods.
 * Same math as `calcWindowBudget` but for one parent category — used by the
 * monthly-cadence rows in `useActiveBudgetPeriod` so the "This month" budget
 * only counts each period's contribution by the days that fall inside the
 * calendar month.
 */
export function calcWindowBudgetForKey(
  periods: readonly BudgetPeriodSlim[],
  from: string,
  to: string,
  key: string
): number {
  return calcWindowBudgetFor(
    periods,
    from,
    to,
    (allocations) => Number(allocations?.[key]) || 0
  );
}

function calcWindowBudgetFor(
  periods: readonly BudgetPeriodSlim[],
  from: string,
  to: string,
  pick: (allocations: Record<string, number>) => number
): number {
  if (periods.length === 0) return 0;
  const wStart = parseISO(from);
  const wEnd = parseISO(to);
  let total = 0;
  for (const p of periods) {
    const pStart = parseISO(p.period_start);
    const pEnd = parseISO(p.period_end);
    const overlapStart = pStart > wStart ? pStart : wStart;
    const overlapEnd = pEnd < wEnd ? pEnd : wEnd;
    const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
    const totalDays = differenceInDays(pEnd, pStart) + 1;
    if (overlapDays <= 0 || totalDays <= 0) continue;
    total += pick(p.allocations ?? {}) * (overlapDays / totalDays);
  }
  return total;
}

export function useMonthlyBudgetTarget(
  displayCurrency: Currency,
  from: string, // "YYYY-MM-DD"
  to: string // "YYYY-MM-DD"
): { totalBudget: number; isLoading: boolean } {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: [
      "monthly_budget_target",
      user?.id ?? "anon",
      displayCurrency,
      from,
      to,
    ] as const,
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;
      const { data, error } = await supabase
        .from("budget_periods")
        .select("period_start, period_end, allocations")
        .eq("user_id", user.id)
        .eq("currency", displayCurrency)
        .lte("period_start", to) // period starts on or before window end
        .gte("period_end", from); // period ends on or after window start
      if (error) throw error;
      const periods = (data ?? []).map((row) => ({
        period_start: row.period_start,
        period_end: row.period_end,
        allocations: (row.allocations as Record<string, number>) ?? {},
      }));
      return calcWindowBudget(periods, from, to);
    },
    enabled: !!user?.id && !!from && !!to,
    staleTime: 30 * 1000,
  });

  return {
    totalBudget: query.data ?? 0,
    isLoading: query.isLoading,
  };
}
