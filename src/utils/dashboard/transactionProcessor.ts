// utils/dashboard/transactionProcessor.ts
import { Transaction } from "@/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
} from "date-fns";

/**
 * Get a YYYY-MM-DD key from a Date using LOCAL timezone (not UTC)
 * This fixes timezone issues where transactions appear on wrong days
 */
function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Available time frame options for filtering transactions
 */
export type TimeframeTab =
  | "thisMonth"
  | "lastMonth"
  | "lastThreeMonths"
  | "lastSixMonths"
  | "thisYear";

/**
 * Filters transactions based on the selected timeframe.
 * @param transactions An array of transactions to filter.
 * @param timeframe A string representing the timeframe to filter by.
 * @param useStatementMonth A boolean indicating whether to use the statement month for filtering.
 * @param statementCycleDay A number representing the day of the month when the statement cycle starts.
 * @param previousPeriod Optional boolean to get data from the previous period instead
 * @returns An array of transactions filtered by the selected timeframe.
 */
export function filterTransactionsByTimeframe(
  transactions: Transaction[],
  timeframe: TimeframeTab,
  useStatementMonth: boolean,
  statementCycleDay: number,
  previousPeriod: boolean = false
): Transaction[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  let startDate: Date;
  let endDate: Date;

  if (useStatementMonth) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Determine the start and end dates based on the statement cycle day
    if (today.getDate() >= statementCycleDay) {
      // We are in the current statement cycle
      startDate = new Date(currentYear, currentMonth, statementCycleDay);
      endDate = new Date(currentYear, currentMonth + 1, statementCycleDay - 1);
    } else {
      // We are in the previous statement cycle
      startDate = new Date(currentYear, currentMonth - 1, statementCycleDay);
      endDate = new Date(currentYear, currentMonth, statementCycleDay - 1);
    }

    // Adjust dates based on the selected timeframe
    switch (timeframe) {
      case "thisMonth":
        // If previousPeriod is true, shift back one month
        if (previousPeriod) {
          startDate = subMonths(startDate, 1);
          endDate = subMonths(endDate, 1);
        }
        break;
      case "lastMonth":
        // For last month, we already shifted one month back
        if (previousPeriod) {
          startDate = subMonths(startDate, 1);
          endDate = subMonths(endDate, 1);
        } else {
          startDate = subMonths(startDate, 1);
          endDate = subMonths(endDate, 1);
        }
        break;
      case "lastThreeMonths":
        if (previousPeriod) {
          startDate = subMonths(startDate, 6);
          endDate = subMonths(startDate, 3);
        } else {
          startDate = subMonths(startDate, 3);
          endDate = new Date(); // Current date
        }
        break;
      case "lastSixMonths":
        if (previousPeriod) {
          startDate = subMonths(startDate, 12);
          endDate = subMonths(endDate, 6);
        } else {
          startDate = subMonths(startDate, 6);
          endDate = new Date(); // Current date
        }
        break;
      case "thisYear":
        if (previousPeriod) {
          startDate = new Date(currentYear - 1, 0, statementCycleDay); // Start of previous year
          endDate = new Date(currentYear - 1, 11, 31); // End of previous year
        } else {
          startDate = new Date(currentYear, 0, statementCycleDay); // Start of current year
          endDate = new Date(currentYear, 11, 31); // End of current year
        }
        break;
      default:
        break;
    }
  } else {
    // Use calendar month
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    switch (timeframe) {
      case "thisMonth":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);

        if (previousPeriod) {
          startDate = startOfMonth(subMonths(today, 1));
          endDate = endOfMonth(subMonths(today, 1));
        }
        break;
      case "lastMonth":
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(subMonths(today, 1));

        if (previousPeriod) {
          startDate = startOfMonth(subMonths(today, 2));
          endDate = endOfMonth(subMonths(today, 2));
        }
        break;
      case "lastThreeMonths":
        if (previousPeriod) {
          startDate = startOfMonth(subMonths(today, 6));
          endDate = endOfMonth(subMonths(today, 3));
        } else {
          startDate = startOfMonth(subMonths(today, 3));
          endDate = endOfMonth(today);
        }
        break;
      case "lastSixMonths":
        if (previousPeriod) {
          startDate = startOfMonth(subMonths(today, 12));
          endDate = endOfMonth(subMonths(today, 6));
        } else {
          startDate = startOfMonth(subMonths(today, 6));
          endDate = endOfMonth(today);
        }
        break;
      case "thisYear":
        startDate = startOfYear(today);
        endDate = endOfYear(today);

        if (previousPeriod) {
          startDate = startOfYear(subYears(today, 1));
          endDate = endOfYear(subYears(today, 1));
        }
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
    }
  }

  // Filter transactions by date range
  const filtered = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  return filtered;
}

/**
 * Calculates the number of days in the selected timeframe.
 * @param timeframe A string representing the timeframe.
 * @param useStatementMonth A boolean indicating whether to use the statement month.
 * @param statementCycleDay A number representing the day of the month when the statement cycle starts.
 * @returns The number of days in the selected timeframe.
 */
export function getDaysInPeriod(
  timeframe: TimeframeTab,
  useStatementMonth: boolean,
  statementCycleDay: number
): number {
  let startDate: Date;
  let endDate: Date;

  if (useStatementMonth) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (today.getDate() >= statementCycleDay) {
      startDate = new Date(currentYear, currentMonth, statementCycleDay);
      endDate = new Date(currentYear, currentMonth + 1, statementCycleDay - 1);
    } else {
      startDate = new Date(currentYear, currentMonth - 1, statementCycleDay);
      endDate = new Date(currentYear, currentMonth, statementCycleDay - 1);
    }

    switch (timeframe) {
      case "thisMonth":
        break;
      case "lastMonth":
        startDate = subMonths(startDate, 1);
        endDate = subMonths(endDate, 1);
        break;
      case "lastThreeMonths":
        startDate = subMonths(startDate, 3);
        break;
      case "lastSixMonths":
        startDate = subMonths(startDate, 6);
        break;
      case "thisYear":
        startDate = new Date(currentYear, 0, statementCycleDay);
        endDate = new Date(currentYear, 11, 31);
        break;
      default:
        break;
    }
  } else {
    const today = new Date();

    switch (timeframe) {
      case "thisMonth":
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case "lastMonth":
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(subMonths(today, 1));
        break;
      case "lastThreeMonths":
        startDate = startOfMonth(subMonths(today, 3));
        endDate = endOfMonth(today);
        break;
      case "lastSixMonths":
        startDate = startOfMonth(subMonths(today, 6));
        endDate = endOfMonth(today);
        break;
      case "thisYear":
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
    }
  }

  const interval = { start: startDate, end: endDate };
  const days = eachDayOfInterval(interval);
  return days.length;
}

/**
 * Groups transactions by a specific time period (day, week, month, year)
 * @param transactions Transactions to group
 * @param period Time period to group by
 * @returns Map of period keys to transaction arrays
 */
export function groupTransactionsByPeriod(
  transactions: Transaction[],
  period: "day" | "week" | "month" | "year"
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    let key: string;

    switch (period) {
      case "day":
        // Use local date key to avoid timezone shift issues
        key = getLocalDateKey(date);
        break;
      case "week": {
        // Get the start of the week (Sunday) in local time
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = getLocalDateKey(weekStart);
        break;
      }
      case "month":
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        break;
      case "year":
        key = `${date.getFullYear()}`;
        break;
      default:
        // Use local date key to avoid timezone shift issues
        key = getLocalDateKey(date);
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)?.push(transaction);
  });

  return grouped;
}

/**
 * Gets date range values from a date object or range object
 * @param dateObj Date object or date range object
 * @returns Object containing start and end dates
 */
export function getDateRangeValues(dateObj: Date | { start: Date; end: Date }) {
  // Check if the date is a Date object or a DateRange object
  if (dateObj instanceof Date) {
    // If it's a Date, use the same date for both start and end
    return { start: dateObj, end: dateObj };
  } else {
    // It's a DateRange object, so we can safely access start and end
    return { start: dateObj.start, end: dateObj.end };
  }
}

/**
 * Formats a date key according to the specified period format
 * @param key Original date key (ISO string or YYYY-MM format)
 * @param period Period format (day, week, month, year)
 * @returns Formatted period label
 */
export function formatPeriodLabel(
  key: string,
  period: "day" | "week" | "month" | "year"
): string {
  let displayPeriod = key;

  try {
    if (period === "day") {
      // Format day: Oct 15
      const date = new Date(key);
      displayPeriod = format(date, "MMM d");
    } else if (period === "week") {
      // For weeks, show date range: Oct 1-7
      const startDate = new Date(key);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      displayPeriod = `${format(startDate, "MMM d")}-${format(endDate, "d")}`;
    } else if (period === "month") {
      // For months, show month name: Oct 2023
      const [year, month] = key.split("-");
      if (year && month) {
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        displayPeriod = format(date, "MMM yyyy");
      }
    } else if (period === "year") {
      // Just show the year as is
      displayPeriod = key;
    }
  } catch (error) {
    console.error("Error formatting period label:", error);
    // Return original key if formatting fails
    return key;
  }

  return displayPeriod;
}

// Export all functions as a singleton
export const transactionProcessor = {
  filterTransactionsByTimeframe,
  getDaysInPeriod,
  groupTransactionsByPeriod,
  getDateRangeValues,
  formatPeriodLabel,
};
