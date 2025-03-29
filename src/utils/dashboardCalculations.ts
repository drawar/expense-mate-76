// src/utils/dashboardCalculations.ts
import { Transaction, Currency, PaymentMethod } from '@/types';
import { convertCurrency } from './currencyConversion';

/**
 * Shared color palette for visualizations
 */
export const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6366F1', // indigo
  '#EF4444', // red
  '#14B8A6', // teal
  '#F97316', // orange
];

/**
 * Chart data item interface
 */
export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

/**
 * Calculate total expenses with currency conversion
 */
export function calculateTotalExpenses(
  transactions: Transaction[],
  displayCurrency: Currency
): number {
  return transactions.reduce((total, tx) => {
    try {
      const convertedAmount = convertCurrency(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );
      return total + convertedAmount;
    } catch (error) {
      console.error('Error converting currency:', error);
      return total;
    }
  }, 0);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate average transaction amount
 */
export function calculateAverageAmount(totalAmount: number, transactionCount: number): number {
  return transactionCount > 0 ? totalAmount / transactionCount : 0;
}

/**
 * Calculate total reward points
 */
export function calculateTotalRewardPoints(transactions: Transaction[]): number {
  return transactions.reduce((total, tx) => total + (tx.rewardPoints || 0), 0);
}

/**
 * Generate payment method chart data
 */
export function generatePaymentMethodChartData(
  transactions: Transaction[],
  displayCurrency: Currency
): ChartDataItem[] {
  if (transactions.length === 0) return [];
  
  const methodTotals = new Map<string, number>();
  
  // Sum up amounts by payment method
  transactions.forEach(tx => {
    try {
      const methodName = tx.paymentMethod?.name || 'Unknown';
      const convertedAmount = convertCurrency(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );
      
      const current = methodTotals.get(methodName) || 0;
      methodTotals.set(methodName, current + convertedAmount);
    } catch (error) {
      console.error('Error processing payment method data:', error);
    }
  });
  
  // Convert to chart data array with colors
  return Array.from(methodTotals.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Generate category chart data
 */
export function generateCategoryChartData(
  transactions: Transaction[],
  displayCurrency: Currency
): ChartDataItem[] {
  if (transactions.length === 0) return [];
  
  const categoryTotals = new Map<string, number>();
  
  // Sum up amounts by category
  transactions.forEach(tx => {
    try {
      const category = tx.category || 'Uncategorized';
      const convertedAmount = convertCurrency(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );
      
      const current = categoryTotals.get(category) || 0;
      categoryTotals.set(category, current + convertedAmount);
    } catch (error) {
      console.error('Error processing category data:', error);
    }
  });
  
  // Convert to chart data array with colors
  return Array.from(categoryTotals.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Get the top item from chart data
 */
export function getTopChartItem(chartData: ChartDataItem[]): { name: string; value: number } | undefined {
  return chartData.length > 0 
    ? { name: chartData[0].name, value: chartData[0].value } 
    : undefined;
}

/**
 * Calculate transaction velocity (rate of transactions over time)
 * Additional metric example that can be easily added
 */
export function calculateTransactionVelocity(
  transactions: Transaction[],
  days: number
): number {
  if (transactions.length === 0 || days === 0) return 0;
  return transactions.length / days;
}

/**
 * Calculate average spend by day of week
 * Additional metric example that can be easily added
 */
export function calculateAverageByDayOfWeek(
  transactions: Transaction[],
  displayCurrency: Currency
): Record<string, number> {
  if (transactions.length === 0) return {};
  
  const dayTotals = new Map<number, number>();
  const dayCounts = new Map<number, number>();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  transactions.forEach(tx => {
    try {
      const txDate = new Date(tx.date);
      const dayOfWeek = txDate.getDay(); // 0-6, starting Sunday
      
      const convertedAmount = convertCurrency(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );
      
      dayTotals.set(dayOfWeek, (dayTotals.get(dayOfWeek) || 0) + convertedAmount);
      dayCounts.set(dayOfWeek, (dayCounts.get(dayOfWeek) || 0) + 1);
    } catch (error) {
      console.error('Error calculating day of week average:', error);
    }
  });
  
  // Calculate averages
  const result: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const total = dayTotals.get(i) || 0;
    const count = dayCounts.get(i) || 0;
    result[dayNames[i]] = count > 0 ? total / count : 0;
  }
  
  return result;
}
