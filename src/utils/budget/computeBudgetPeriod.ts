/**
 * Pure function: given a salary income + the user's per-parent-category
 * percentages + savings %, return the budget_periods row payload to upsert.
 *
 * Each parent category's dollar budget = salary_amount × percentage / 100,
 * rounded to 2 decimals. Categories missing from `allocationsPct` are
 * treated as 0%. Savings is treated as a first-class allocation slot and
 * stored under the reserved "savings" key in the returned allocations map;
 * it is NEVER a spending parent-category.
 *
 * The sum of (savings + spending) percentages should be ≤ 100; any
 * remainder is implicit savings on top of the explicit savings row. The
 * settings UI warns above 100 but this function does not enforce it.
 */

import type { Currency } from "@/types";
import type { IncomeFrequency } from "@/types/income";
import { computePeriodEnd } from "./computePeriodEnd";
import {
  DEFAULT_ALLOCATIONS,
  DEFAULT_SAVINGS_PCT,
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
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
  /**
   * Snapshot amounts keyed by parent_category_id, plus the reserved
   * "savings" key for the pay-yourself-first slot.
   */
  allocations: Record<string, number>;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeBudgetPeriod(
  salary: SalaryInput,
  allocationsPct: Partial<
    Record<ParentCategoryId, number>
  > = DEFAULT_ALLOCATIONS,
  savingsPct: number = DEFAULT_SAVINGS_PCT
): BudgetPeriodPayload {
  const allocations: Record<string, number> = {
    [SAVINGS_ID]: round2((salary.amount * Math.max(0, savingsPct)) / 100),
  };
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
