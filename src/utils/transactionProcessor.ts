// src/utils/transactionProcessor.ts
import { Transaction, Currency } from '@/types';
import { getCategoryFromMCC, getCategoryFromMerchantName } from './categoryMapping';

export type TimeframeTab = 'thisMonth' | 'lastMonth' | 'lastThreeMonths' | 'thisYear';

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Process transactions to ensure all have categories
 */
export function processCategoriesForTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.map(tx => {
    if (tx.category && tx.category !== 'Uncategorized') {
      return tx;
    }
    
    let category = 'Uncategorized';
    if (tx.merchant?.mcc?.code) {
      category = getCategoryFromMCC(tx.merchant.mcc.code);
    } else if (tx.merchant?.name) {
      category = getCategoryFromMerchantName(tx.merchant.name) || 'Uncategorized';
    }
    
    return {...tx, category};
  });
}

/**
 * Generate date ranges based on current date and filtering options
 */
export function generateDateRanges(
  useStatementMonth: boolean = false, 
  statementCycleDay: number = 1
): Record<string, DateRange | Date> {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Calculate standard date ranges
  const thisMonthStart = new Date(currentYear, currentMonth, 1);
  // Set end time to the end of today (23:59:59.999) to include all of today's transactions
  const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);
  thisMonthEnd.setHours(23, 59, 59, 999);
  
  const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthEnd = new Date(currentYear, currentMonth, 0);
  
  const threeMonthsAgo = new Date(currentYear, currentMonth - 3, now.getDate());
  
  const thisYearStart = new Date(currentYear, 0, 1);
  const thisYearEnd = new Date(currentYear, 11, 31);
  
  // Statement date range if enabled
  let statementRange = { start: thisMonthStart, end: thisMonthEnd };
  
  if (useStatementMonth) {
    // Start date: statementCycleDay of previous month
    let startMonth = currentMonth - 1;
    let startYear = currentYear;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
    
    const statementStart = new Date(startYear, startMonth, statementCycleDay);
    
    // End date: day before statementCycleDay of current month
    let statementEnd = new Date(currentYear, currentMonth, statementCycleDay - 1);
    // If statementCycleDay is 1, set to end of previous month
    if (statementCycleDay === 1) {
      statementEnd = new Date(currentYear, currentMonth, 0);
    }
    
    // Ensure end date is not in the future
    if (statementEnd > now) {
      statementEnd = now;
    }
    
    statementRange = { start: statementStart, end: statementEnd };
  }
  
  return {
    thisMonth: { start: thisMonthStart, end: thisMonthEnd },
    lastMonth: { start: lastMonthStart, end: lastMonthEnd },
    threeMonthsAgo,
    thisYear: { start: thisYearStart, end: thisYearEnd },
    statement: statementRange
  };
}

/**
 * Filter transactions based on timeframe and statement settings
 */
export function filterTransactionsByTimeframe(
  transactions: Transaction[],
  timeframe: TimeframeTab,
  useStatementMonth: boolean,
  statementCycleDay: number
): Transaction[] {
  const dateRanges = generateDateRanges(useStatementMonth, statementCycleDay);
  
  // If statement cycle is enabled, filter by statement period
  if (useStatementMonth) {
    return filterTransactionsByDateRange(transactions, dateRanges.statement as DateRange);
  }
  
  // Otherwise filter by selected timeframe
  switch (timeframe) {
    case 'thisMonth':
      return filterTransactionsByDateRange(transactions, dateRanges.thisMonth as DateRange);
    case 'lastMonth':
      return filterTransactionsByDateRange(transactions, dateRanges.lastMonth as DateRange);
    case 'lastThreeMonths': {
      const threeMonthsAgo = dateRanges.threeMonthsAgo as Date;
      return transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= threeMonthsAgo;
      });
    }
    case 'thisYear':
      return filterTransactionsByDateRange(transactions, dateRanges.thisYear as DateRange);
    default:
      return transactions;
  }
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  dateRange: DateRange
): Transaction[] {
  return transactions.filter(tx => {
    // Create a date object from the transaction date string
    const txDate = new Date(tx.date);
    
    // Reset hours to ensure date-only comparison (start of day)
    const txDateOnly = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
    const rangeStartDate = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), dateRange.start.getDate());
    
    // For end date comparison, set to end of day to include all transactions on that day
    const rangeEndDate = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth(), dateRange.end.getDate());
    rangeEndDate.setHours(23, 59, 59, 999);
    
    return txDateOnly >= rangeStartDate && txDateOnly <= rangeEndDate;
  });
}

/**
 * Calculate the date range duration in days
 */
export function calculateDateRangeDuration(dateRange: DateRange): number {
  const diffTime = dateRange.end.getTime() - dateRange.start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get the number of days in the current filter period
 */
export function getDaysInPeriod(
  timeframe: TimeframeTab,
  useStatementMonth: boolean,
  statementCycleDay: number
): number {
  const dateRanges = generateDateRanges(useStatementMonth, statementCycleDay);
  
  if (useStatementMonth) {
    return calculateDateRangeDuration(dateRanges.statement as DateRange);
  }
  
  switch (timeframe) {
    case 'thisMonth':
      return calculateDateRangeDuration(dateRanges.thisMonth as DateRange);
    case 'lastMonth':
      return calculateDateRangeDuration(dateRanges.lastMonth as DateRange);
    case 'lastThreeMonths': {
      const threeMonthsAgo = dateRanges.threeMonthsAgo as Date;
      const now = new Date();
      return Math.ceil((now.getTime() - threeMonthsAgo.getTime()) / (1000 * 60 * 60 * 24));
    }
    case 'thisYear':
      return calculateDateRangeDuration(dateRanges.thisYear as DateRange);
    default:
      return 30; // Default to 30 days
  }
}
