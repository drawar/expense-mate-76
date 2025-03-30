// src/components/dashboard/abstractions/AbstractTrendCard.tsx
import React from 'react';
import { Transaction } from '@/types';
import AbstractFinancialInsightCard, { 
  FinancialInsightCardProps 
} from '@/components/dashboard/abstractions/AbstractFinancialInsightCard';

/**
 * Base props for trend analysis cards
 */
export interface TrendCardProps extends FinancialInsightCardProps {
  transactions: Transaction[];
  period?: 'day' | 'week' | 'month' | 'quarter';
  comparisonPeriod?: 'previous' | 'lastYear';
  currency?: string;
}

/**
 * Abstract class for cards that analyze trends over time
 * Extends AbstractFinancialInsightCard and adds trend-specific functionality
 */
abstract class AbstractTrendCard<P extends TrendCardProps> extends AbstractFinancialInsightCard<P> {
  /**
   * Process transactions to extract trend data
   * Abstract method that must be implemented by subclasses
   */
  protected abstract processTrendData(): any;
  
  /**
   * Group transactions by time period
   */
  protected groupTransactionsByPeriod(
    transactions: Transaction[], 
    period: 'day' | 'week' | 'month' | 'year'
  ): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      
      let key = '';
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the Monday of the week
          const day = date.getDay() || 7; // Convert Sunday (0) to 7
          const mondayDate = new Date(date);
          mondayDate.setDate(date.getDate() - day + 1);
          key = mondayDate.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = `${date.getFullYear()}`;
          break;
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(transaction);
    });
    
    return groups;
  }
  
  /**
   * Calculate the percentage change between two values
   */
  protected calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }
  
  /**
   * Check if there's enough data for trend analysis
   */
  protected hasEnoughDataForTrend(transactions: Transaction[], minimumPeriods: number = 2): boolean {
    if (transactions.length === 0) return false;
    
    // Get the earliest and latest transaction dates
    const dates = transactions.map(tx => new Date(tx.date).getTime());
    const earliestDate = new Date(Math.min(...dates));
    const latestDate = new Date(Math.max(...dates));
    
    // Calculate the difference in months
    const monthsDiff = 
      (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 + 
      (latestDate.getMonth() - earliestDate.getMonth());
    
    return monthsDiff >= minimumPeriods - 1;
  }
  
  /**
   * Format percentage change with +/- sign and color
   */
  protected formatTrendValue(value: number): {text: string, color: string} {
    const formattedValue = value.toFixed(1);
    const isPositive = value > 0;
    const prefix = isPositive ? '+' : '';
    
    return {
      text: `${prefix}${formattedValue}%`,
      color: isPositive ? 'text-red-500' : 'text-green-500'
    };
  }
}

export default AbstractTrendCard;
