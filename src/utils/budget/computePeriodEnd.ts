/**
 * Compute the end date of a pay period from its start date + frequency.
 *
 * biweekly     = start + 14 days
 * semi_monthly = if start.day ≤ 15 → last day of same month
 *                else                → 15th of next month
 * monthly      = start + 1 calendar month (addMonths clamps to last day
 *                of target month when start.day doesn't exist there,
 *                e.g. Jan 31 + 1mo = Feb 28/29)
 *
 * one_off has no pay period and callers should not reach this function with
 * that frequency (syncBudgetPeriodForIncome guards it upstream). If it does,
 * we fall through to the monthly branch as a safe default rather than throw.
 *
 * Input and output are ISO date strings ("YYYY-MM-DD") — timezone-free dates
 * to keep parity with the recurring_income.start_date column type.
 */

import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  parseISO,
  setDate,
} from "date-fns";
import type { IncomeFrequency } from "@/types/income";

export function computePeriodEnd(
  startDate: string,
  frequency: IncomeFrequency
): string {
  const start = parseISO(startDate);
  let end: Date;
  if (frequency === "biweekly") {
    end = addDays(start, 14);
  } else if (frequency === "semi_monthly") {
    const day = start.getDate();
    end = day <= 15 ? endOfMonth(start) : setDate(addMonths(start, 1), 15);
  } else {
    end = addMonths(start, 1);
  }
  return format(end, "yyyy-MM-dd");
}
