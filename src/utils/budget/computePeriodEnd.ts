/**
 * Compute the end date of a pay period from its start date + frequency.
 *
 * biweekly = start + 14 days; monthly = start + 1 calendar month. `addMonths`
 * clamps to the last day of the target month when the start day doesn't exist
 * there (e.g. Jan 31 + 1mo = Feb 28/29).
 *
 * one_off has no pay period and callers should not reach this function with
 * that frequency (syncBudgetPeriodForIncome guards it upstream). If it does,
 * we fall through to the monthly branch as a safe default rather than throw.
 *
 * Input and output are ISO date strings ("YYYY-MM-DD") — timezone-free dates
 * to keep parity with the recurring_income.start_date column type.
 */

import { addDays, addMonths, format, parseISO } from "date-fns";
import type { IncomeFrequency } from "@/types/income";

export function computePeriodEnd(
  startDate: string,
  frequency: IncomeFrequency
): string {
  const start = parseISO(startDate);
  const end =
    frequency === "biweekly" ? addDays(start, 14) : addMonths(start, 1);
  return format(end, "yyyy-MM-dd");
}
