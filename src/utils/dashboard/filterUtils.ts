// utils/dashboard/filterUtils.ts
import { Transaction } from "@/types";
import { TimeframeTab } from "./types";
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
  parseISO,
  isValid,
  isBefore,
  isAfter,
  isSameDay,
} from "date-fns";

/**
 * Gets the date range for a given timeframe.
 * Returns start and end dates formatted as YYYY-MM-DD strings.
 */
export function getTimeframeDateRange(timeframe: TimeframeTab): {
  from: string;
  to: string;
} | null {
  if (timeframe === "allTime") {
    return null;
  }

  const today = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (timeframe) {
    case "thisMonth":
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;
    case "lastMonth":
      startDate = startOfMonth(subMonths(today, 1));
      endDate = endOfMonth(subMonths(today, 1));
      break;
    case "thisYear":
      startDate = startOfYear(today);
      endDate = endOfYear(today);
      break;
    case "lastYear":
      startDate = startOfYear(subYears(today, 1));
      endDate = endOfYear(subYears(today, 1));
      break;
    case "thisWeek":
      startDate = startOfWeek(today, { weekStartsOn: 0 });
      endDate = endOfWeek(today, { weekStartsOn: 0 });
      break;
    case "lastWeek": {
      const lastWeekStart = new Date(today);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      startDate = startOfWeek(lastWeekStart, { weekStartsOn: 0 });
      endDate = endOfWeek(lastWeekStart, { weekStartsOn: 0 });
      break;
    }
    case "lastTwoMonths":
      startDate = startOfMonth(subMonths(today, 1));
      endDate = endOfMonth(today);
      break;
    case "lastThreeMonths":
      startDate = startOfMonth(subMonths(today, 2));
      endDate = endOfMonth(today);
      break;
    case "lastSixMonths":
      startDate = startOfMonth(subMonths(today, 5));
      endDate = endOfMonth(today);
      break;
    default:
      startDate = startOfMonth(today);
      endDate = endOfMonth(today);
      break;
  }

  return {
    from: format(startDate, "yyyy-MM-dd"),
    to: format(endDate, "yyyy-MM-dd"),
  };
}

/**
 * Filters transactions based on the selected timeframe.
 *
 * @param transactions An array of transactions to filter.
 * @param timeframe The timeframe to filter by.
 * @param useStatementMonth Whether to use the statement month for filtering.
 * @param statementCycleDay The day of the month when the statement cycle starts.
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
    console.log("No transactions to filter");
    return [];
  }

  let startDate: Date;
  let endDate: Date;

  if (timeframe === "allTime") {
    console.log("Returning all transactions for allTime filter");
    return transactions;
  }

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
      case "thisYear":
        if (previousPeriod) {
          startDate = new Date(currentYear - 1, 0, statementCycleDay); // Start of previous year
          endDate = new Date(currentYear - 1, 11, 31); // End of previous year
        } else {
          startDate = new Date(currentYear, 0, statementCycleDay); // Start of current year
          endDate = new Date(currentYear, 11, 31); // End of current year
        }
        break;
      case "lastYear":
        if (previousPeriod) {
          startDate = new Date(currentYear - 2, 0, statementCycleDay); // Start of year before last
          endDate = new Date(currentYear - 2, 11, 31); // End of year before last
        } else {
          startDate = new Date(currentYear - 1, 0, statementCycleDay); // Start of last year
          endDate = new Date(currentYear - 1, 11, 31); // End of last year
        }
        break;
      case "lastThreeMonths":
        if (previousPeriod) {
          // Previous 3 months before the current 3 months
          startDate = subMonths(startDate, 6);
          endDate = subMonths(endDate, 3);
        } else {
          // Last 3 months including current statement month
          startDate = subMonths(startDate, 2);
        }
        break;
      default:
        break;
    }
  } else {
    // Use calendar month
    const today = new Date();

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
      case "thisYear":
        startDate = startOfYear(today);
        endDate = endOfYear(today);

        if (previousPeriod) {
          startDate = startOfYear(subYears(today, 1));
          endDate = endOfYear(subYears(today, 1));
        }
        break;
      case "lastYear":
        startDate = startOfYear(subYears(today, 1));
        endDate = endOfYear(subYears(today, 1));

        if (previousPeriod) {
          startDate = startOfYear(subYears(today, 2));
          endDate = endOfYear(subYears(today, 2));
        }
        break;
      case "thisWeek":
        startDate = startOfWeek(today, { weekStartsOn: 0 });
        endDate = endOfWeek(today, { weekStartsOn: 0 });

        if (previousPeriod) {
          const lastWeek = new Date(today);
          lastWeek.setDate(lastWeek.getDate() - 7);
          startDate = startOfWeek(lastWeek, { weekStartsOn: 0 });
          endDate = endOfWeek(lastWeek, { weekStartsOn: 0 });
        }
        break;
      case "lastWeek": {
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        startDate = startOfWeek(lastWeekStart, { weekStartsOn: 0 });
        endDate = endOfWeek(lastWeekStart, { weekStartsOn: 0 });

        if (previousPeriod) {
          const twoWeeksAgo = new Date(today);
          twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
          startDate = startOfWeek(twoWeeksAgo, { weekStartsOn: 0 });
          endDate = endOfWeek(twoWeeksAgo, { weekStartsOn: 0 });
        }
        break;
      }
      case "lastTwoMonths":
        endDate = endOfMonth(today);
        startDate = startOfMonth(subMonths(today, 1));

        if (previousPeriod) {
          endDate = endOfMonth(subMonths(today, 2));
          startDate = startOfMonth(subMonths(today, 3));
        }
        break;
      case "lastThreeMonths":
        endDate = endOfMonth(today);
        startDate = startOfMonth(subMonths(today, 2));

        if (previousPeriod) {
          endDate = endOfMonth(subMonths(today, 3));
          startDate = startOfMonth(subMonths(today, 5));
        }
        break;
      case "lastSixMonths":
        endDate = endOfMonth(today);
        startDate = startOfMonth(subMonths(today, 5));

        if (previousPeriod) {
          endDate = endOfMonth(subMonths(today, 6));
          startDate = startOfMonth(subMonths(today, 11));
        }
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
    }
  }

  // Log filtering details for debugging
  console.log(
    `Filtering for ${previousPeriod ? "previous" : "current"} period:`,
    {
      timeframe,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      useStatementMonth,
      originalTransactionCount: transactions.length,
    }
  );

  // Track how many comparisons we've logged
  let comparisonLogCount = 0;

  // Filter transactions based on date range with improved date parsing
  const filtered = transactions.filter((transaction) => {
    if (!transaction.date) {
      console.warn("Transaction missing date:", transaction.id);
      return false;
    }

    let transactionDate: Date;

    // Handle both string and Date objects
    if (typeof transaction.date === "string") {
      // Try parsing ISO string first
      transactionDate = parseISO(transaction.date);

      // If that fails, try creating a new Date
      if (!isValid(transactionDate)) {
        transactionDate = new Date(transaction.date);
      }
    } else {
      transactionDate = new Date(transaction.date);
    }

    // Check if the parsed date is valid
    if (!isValid(transactionDate)) {
      console.warn(
        "Invalid transaction date:",
        transaction.date,
        "for transaction:",
        transaction.id
      );
      return false;
    }

    // Check if transaction date is within range (inclusive)
    const isInRange =
      (isSameDay(transactionDate, startDate) ||
        isAfter(transactionDate, startDate)) &&
      (isSameDay(transactionDate, endDate) ||
        isBefore(transactionDate, endDate));

    // Log first few comparisons for debugging
    if (comparisonLogCount < 3) {
      console.log("Transaction date comparison:", {
        transactionId: transaction.id,
        transactionDate: format(transactionDate, "yyyy-MM-dd"),
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        isInRange,
      });
      comparisonLogCount++;
    }

    return isInRange;
  });

  console.log(
    `Found ${filtered.length} transactions for ${previousPeriod ? "previous" : "current"} period (${timeframe})`
  );

  return filtered;
}

/**
 * Calculates the number of days in the selected timeframe.
 *
 * @param timeframe The timeframe to calculate days for.
 * @param useStatementMonth Whether to use the statement month.
 * @param statementCycleDay The day of the month when the statement cycle starts.
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
      case "thisYear":
        startDate = startOfMonth(
          new Date(currentYear, currentMonth, statementCycleDay)
        );
        endDate = endOfMonth(
          new Date(currentYear, currentMonth + 1, statementCycleDay - 1)
        );
        break;
      case "lastYear":
        startDate = startOfMonth(
          new Date(currentYear - 1, currentMonth, statementCycleDay)
        );
        endDate = endOfMonth(
          new Date(currentYear, currentMonth, statementCycleDay - 1)
        );
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
      case "thisYear":
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      case "lastYear":
        startDate = startOfYear(subYears(today, 1));
        endDate = endOfYear(subYears(today, 1));
        break;
      case "thisWeek":
        startDate = startOfWeek(today, { weekStartsOn: 0 });
        endDate = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case "lastWeek": {
        const lastWeekStart = subMonths(
          startOfWeek(today, { weekStartsOn: 0 }),
          1
        );
        startDate = startOfWeek(lastWeekStart, { weekStartsOn: 0 });
        endDate = endOfWeek(lastWeekStart, { weekStartsOn: 0 });
        break;
      }
      case "lastTwoMonths":
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(today);
        break;
      case "lastThreeMonths":
        startDate = startOfMonth(subMonths(today, 2));
        endDate = endOfMonth(today);
        break;
      case "lastSixMonths":
        startDate = startOfMonth(subMonths(today, 5));
        endDate = endOfMonth(today);
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
