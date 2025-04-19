// src/services/core/DateService.ts

import { SpendingPeriodType } from '../rewards/types';

/**
 * Service for date-related operations
 */
export class DateService {
  private static _instance: DateService;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): DateService {
    if (!this._instance) {
      this._instance = new DateService();
    }
    return this._instance;
  }
  
  /**
   * Calculate date range for a period type
   */
  public calculateDateRange(
    date: Date,
    periodType: SpendingPeriodType,
    statementDay: number = 1
  ): { startDate: Date; endDate: Date } {
    const referenceDate = new Date(date);
    
    switch (periodType) {
      case 'calendar_month':
        return this.calculateCalendarMonthRange(referenceDate);
      
      case 'statement_month':
        return this.calculateStatementMonthRange(referenceDate, statementDay);
      
      case 'rolling_30_days':
        return this.calculateRolling30DaysRange(referenceDate);
      
      default:
        return this.calculateCalendarMonthRange(referenceDate);
    }
  }
  
  /**
   * Calculate calendar month range
   */
  private calculateCalendarMonthRange(date: Date): { startDate: Date; endDate: Date } {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of month at 00:00:00
    const startDate = new Date(year, month, 1);
    
    // First day of next month at 00:00:00
    const endDate = new Date(year, month + 1, 1);
    
    return { startDate, endDate };
  }
  
  /**
   * Calculate statement month range
   */
  private calculateStatementMonthRange(
    date: Date,
    statementDay: number
  ): { startDate: Date; endDate: Date } {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    let startMonth = month;
    let startYear = year;
    let endMonth = month;
    let endYear = year;
    
    // If the current day is before the statement day, the statement month
    // started in the previous month
    if (day < statementDay) {
      startMonth = month - 1;
      
      // Handle January case
      if (startMonth < 0) {
        startMonth = 11; // December
        startYear = year - 1;
      }
    }
    
    // The end date is the statement day of the next month from start
    endMonth = startMonth + 1;
    endYear = startYear;
    
    // Handle December case
    if (endMonth > 11) {
      endMonth = 0; // January
      endYear = startYear + 1;
    }
    
    // Create the dates
    const startDate = new Date(startYear, startMonth, statementDay);
    const endDate = new Date(endYear, endMonth, statementDay);
    
    return { startDate, endDate };
  }
  
  /**
   * Calculate rolling 30 days range
   */
  private calculateRolling30DaysRange(date: Date): { startDate: Date; endDate: Date } {
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0); // Start of day
    
    return { startDate, endDate };
  }
  
  /**
   * Format date to YYYY-MM-DD
   */
  public formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }
  
  /**
   * Format date to human-readable format
   */
  public formatDateForDisplay(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  /**
   * Get start of month date
   */
  public getStartOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  
  /**
   * Get end of month date
   */
  public getEndOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  
  /**
   * Get current month name
   */
  public getCurrentMonthName(date: Date = new Date()): string {
    return date.toLocaleString('en-US', { month: 'long' });
  }
  
  /**
   * Get month name from month number (0-11)
   */
  public getMonthName(month: number): string {
    return new Date(2000, month, 1).toLocaleString('en-US', { month: 'long' });
  }
}

// Export a singleton instance
export const dateService = DateService.getInstance();