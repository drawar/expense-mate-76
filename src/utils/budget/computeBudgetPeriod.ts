/**
 * Pure function: given a salary income + the user's per-parent-category
 * percentages, return the budget_periods row payload to upsert.
 *
 * Each parent category's dollar budget = salary_amount × percentage / 100,
 * rounded to 2 decimals. Categories missing from `allocationsPct` are treated
 * as 0%. If sum(percentages) < 100, the unallocated remainder is implicit
 * savings (no row for it — see DEFAULT_ALLOCATIONS docstring in defaults.ts).
 */

import type { Currency } from "@/types";
import type { IncomeFrequency } from "@/types/income";
import { computePeriodEnd } from "./computePeriodEnd";
import {
  DEFAULT_ALLOCATIONS,
  PARENT_CATEGORY_IDS,
  type ParentCategoryId,
} from "./defaults";

export interface SalaryInput {
  id: string; // income row id (becomes budget_periods.income_id)
  startDate: string; // "YYYY-MM-DD"
  amount: number;
  currency: Currency;
  frequency: IncomeFrequency;
}

export interface BudgetPeriodPayload {
  income_id: string;
  currency: string;
  period_start: string;
  period_end: string;
  salary_amount: number;
  allocations: Record<string, number>;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeBudgetPeriod(
  salary: SalaryInput,
  allocationsPct: Partial<
    Record<ParentCategoryId, number>
  > = DEFAULT_ALLOCATIONS
): BudgetPeriodPayload {
  const allocations: Record<string, number> = {};
  for (const parentId of PARENT_CATEGORY_IDS) {
    const pct = allocationsPct[parentId] ?? 0;
    allocations[parentId] = round2((salary.amount * pct) / 100);
  }
  return {
    income_id: salary.id,
    currency: salary.currency,
    period_start: salary.startDate,
    period_end: computePeriodEnd(salary.startDate, salary.frequency),
    salary_amount: salary.amount,
    allocations,
  };
}
