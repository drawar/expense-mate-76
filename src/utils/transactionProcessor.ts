// src/utils/transactionProcessor.ts
import { Transaction } from '@/types';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';

export type TimeframeTab =
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'lastYear'
  | 'thisWeek'
  | 'lastWeek'
  | 'allTime'
  | 'custom';

/**
 * Filters transactions based on the selected timeframe.
 * @param transactions An array of transactions to filter.
 * @param timeframe A string representing the timeframe to filter by.
 * @param useStatementMonth A boolean indicating whether to use the statement month for filtering.
 * @param statementCycleDay A number representing the day of the month when the statement cycle starts.
 * @returns An array of transactions filtered by the selected timeframe.
 */
export const filterTransactionsByTimeframe = (
  transactions: Transaction[],
  timeframe: TimeframeTab,
  useStatementMonth: boolean,
  statementCycleDay: number
): Transaction[] => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  let startDate: Date;
  let endDate: Date;

  if (timeframe === 'allTime') {
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
      case 'thisMonth':
        break; // Use the calculated startDate and endDate for the current statement cycle
      case 'lastMonth':
        startDate = subMonths(startDate, 1);
        endDate = subMonths(endDate, 1);
        break;
      case 'thisYear':
        startDate = startOfMonth(new Date(currentYear, currentMonth, statementCycleDay));
        endDate = endOfMonth(new Date(currentYear, currentMonth + 1, statementCycleDay - 1));
        break;
      case 'lastYear':
        startDate = startOfMonth(new Date(currentYear - 1, currentMonth, statementCycleDay));
        endDate = endOfMonth(new Date(currentYear, currentMonth, statementCycleDay - 1));
        break;
      default:
        break;
    }
  } else {
    // Use calendar month
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    switch (timeframe) {
      case 'thisMonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'lastMonth':
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(subMonths(today, 1));
        break;
      case 'thisYear':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      case 'lastYear':
        startDate = startOfYear(subYears(today, 1));
        endDate = endOfYear(subYears(today, 1));
        break;
      case 'thisWeek':
        startDate = startOfWeek(today, { weekStartsOn: 0 });
        endDate = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'lastWeek':
        const lastWeekStart = subMonths(startOfWeek(today, { weekStartsOn: 0 }), 1);
        startDate = startOfWeek(lastWeekStart, { weekStartsOn: 0 });
        endDate = endOfWeek(lastWeekStart, { weekStartsOn: 0 });
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
    }
  }

  const filtered = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  return filtered;
};

/**
 * Calculates the number of days in the selected timeframe.
 * @param timeframe A string representing the timeframe.
 * @param useStatementMonth A boolean indicating whether to use the statement month.
 * @param statementCycleDay A number representing the day of the month when the statement cycle starts.
 * @returns The number of days in the selected timeframe.
 */
export const getDaysInPeriod = (
  timeframe: TimeframeTab,
  useStatementMonth: boolean,
  statementCycleDay: number
): number => {
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
      case 'thisMonth':
        break;
      case 'lastMonth':
        startDate = subMonths(startDate, 1);
        endDate = subMonths(endDate, 1);
        break;
      case 'thisYear':
        startDate = startOfMonth(new Date(currentYear, currentMonth, statementCycleDay));
        endDate = endOfMonth(new Date(currentYear, currentMonth + 1, statementCycleDay - 1));
        break;
      case 'lastYear':
        startDate = startOfMonth(new Date(currentYear - 1, currentMonth, statementCycleDay));
        endDate = endOfMonth(new Date(currentYear, currentMonth, statementCycleDay - 1));
        break;
      default:
        break;
    }
  } else {
    const today = new Date();

    switch (timeframe) {
      case 'thisMonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'lastMonth':
        startDate = startOfMonth(subMonths(today, 1));
        endDate = endOfMonth(subMonths(today, 1));
        break;
      case 'thisYear':
        startDate = startOfYear(today);
        endDate = endOfYear(today);
        break;
      case 'lastYear':
        startDate = startOfYear(subYears(today, 1));
        endDate = endOfYear(subYears(today, 1));
        break;
      case 'thisWeek':
        startDate = startOfWeek(today, { weekStartsOn: 0 });
        endDate = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'lastWeek':
        const lastWeekStart = subMonths(startOfWeek(today, { weekStartsOn: 0 }), 1);
        startDate = startOfWeek(lastWeekStart, { weekStartsOn: 0 });
        endDate = endOfWeek(lastWeekStart, { weekStartsOn: 0 });
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
};

const getDateRangeValues = (dateObj: Date | { start: Date, end: Date }) => {
  // Check if the date is a Date object or a DateRange object
  if (dateObj instanceof Date) {
    // If it's a Date, use the same date for both start and end
    return { start: dateObj, end: dateObj };
  } else {
    // It's a DateRange object, so we can safely access start and end
    return { start: dateObj.start, end: dateObj.end };
  }
};
