import {
  format,
  parse,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
} from "date-fns";
import { PaymentMethod } from "@/types";

/**
 * Formats a date string into a human-readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "MMM d, yyyy");
};

/**
 * Formats a date string into a short format (MM/DD/YY)
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "MM/dd/yy");
};

/**
 * Formats a date with time
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "MMM d, yyyy h:mm a");
};

/**
 * Gets the current date as an ISO string (YYYY-MM-DD)
 */
export const getCurrentDateString = (): string => {
  return format(new Date(), "yyyy-MM-dd");
};

/**
 * Calculate which statement period (year/month) a date belongs to.
 * For statement_month tracking: if date < statementDay, it belongs to the previous month's period.
 * e.g., Jan 5 with statement_day=19 → belongs to December period (Dec 19 - Jan 18)
 *
 * @param date - The date to check
 * @param statementDay - The day of month when statement period starts (1-31)
 * @returns Object with year and month (1-indexed) of the period the date belongs to
 */
export const getStatementPeriodYearMonth = (
  date: Date,
  statementDay: number
): { year: number; month: number } => {
  const txDay = date.getDate();
  let periodYear = date.getFullYear();
  let periodMonth = date.getMonth() + 1; // 1-indexed

  // If date is BEFORE the statement day, it belongs to the PREVIOUS month's period
  if (txDay < statementDay) {
    periodMonth -= 1;
    if (periodMonth === 0) {
      periodMonth = 12;
      periodYear -= 1;
    }
  }

  return { year: periodYear, month: periodMonth };
};

/**
 * Gets a date range for a statement period
 */
export const getStatementPeriod = (
  paymentMethod: PaymentMethod,
  date: Date = new Date()
): { start: Date; end: Date } => {
  // If no statement configuration, default to calendar month
  if (!paymentMethod.statementStartDay || !paymentMethod.isMonthlyStatement) {
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  }

  // Get statement start day (1-31)
  const statementDay = paymentMethod.statementStartDay;

  // Use the shared helper to get which period this date belongs to
  const { year, month } = getStatementPeriodYearMonth(date, statementDay);

  // Statement start is the statementDay of that period's month
  const statementStart = new Date(year, month - 1, statementDay);

  // Statement end is one day before the next statement start
  const statementEnd = new Date(statementStart);
  statementEnd.setMonth(statementEnd.getMonth() + 1);
  statementEnd.setDate(statementEnd.getDate() - 1);

  return { start: statementStart, end: statementEnd };
};

/**
 * Checks if a date is within a statement period
 */
export const isDateInStatementPeriod = (
  date: Date,
  paymentMethod: PaymentMethod
): boolean => {
  const { start, end } = getStatementPeriod(paymentMethod, date);
  return isWithinInterval(date, { start, end });
};

/**
 * Circular distance (in days) between two days-of-month, accounting
 * for short months. Used by recurring-merchant reminder to test if
 * today falls within ±N days of a merchant's typical charge day —
 * with wrap-around so a Feb-28th "today" is 3 days from a day-31
 * merchant, not 3 days early.
 *
 * Examples:
 *   dayOfMonthDistance(1, 1, 30)   === 0
 *   dayOfMonthDistance(2, 30, 30)  === 3  (wraps: 30→31/1 (n/a) →1→2)
 *   dayOfMonthDistance(31, 1, 28)  === 2  (Feb wrap: 31→28 (clamp) →1)
 *   dayOfMonthDistance(15, 15, 31) === 0
 */
export const dayOfMonthDistance = (
  a: number,
  b: number,
  monthLen: number
): number => {
  const clampA = Math.min(Math.max(1, a), monthLen);
  const clampB = Math.min(Math.max(1, b), monthLen);
  const raw = Math.abs(clampA - clampB);
  return Math.min(raw, monthLen - raw);
};
