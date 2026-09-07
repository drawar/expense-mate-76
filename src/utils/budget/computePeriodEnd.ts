/**
 * Compute the end date of a pay period from its start date + frequency.
 *
 * biweekly = start + 14 days; monthly = start + 1 calendar month. `addMonths`
 * clamps to the last day of the target month when the start day doesn't exist
 * there (e.g. Jan 31 + 1mo = Feb 28/29).
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
