import { format, parse, isWithinInterval, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { PaymentMethod } from '@/types';

/**
 * Formats a date string into a human-readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy');
};

/**
 * Formats a date string into a short format (MM/DD/YY)
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'MM/dd/yy');
};

/**
 * Formats a date with time
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, 'MMM d, yyyy h:mm a');
};

/**
 * Gets the current date as an ISO string (YYYY-MM-DD)
 */
export const getCurrentDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
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
  
  // Find the start date of the current statement period
  let statementStart = new Date(date.getFullYear(), date.getMonth(), statementDay);
  
  // If the current date is before the statement start day, the statement started in the previous month
  if (date.getDate() < statementDay) {
    statementStart = new Date(date.getFullYear(), date.getMonth() - 1, statementDay);
  }
  
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
