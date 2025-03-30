// src/utils/dashboardCalculations.ts
import { Transaction, Currency } from '@/types';
import { 
  calculateTotalExpenses, 
  calculatePercentageChange, 
  calculateAverageAmount, 
  calculateTotalRewardPoints, 
  calculateTransactionVelocity, 
  calculateAverageByDayOfWeek,
  getTopChartItem,
  ChartDataItem
} from './dashboardUtils';
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
