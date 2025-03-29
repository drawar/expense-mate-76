// src/utils/chartDataProcessor.ts
import { Transaction, Currency } from '@/types';
import { convertCurrency } from './currencyConversion';

/**
 * Period grouping types for chart data
 */
export type GroupingPeriod = 'day' | 'week' | 'month' | 'year';

/**
 * Chart data item with display properties
 */
export interface ProcessedChartItem {
  period: string;
  amount: number;
  originalKey: string;
  topCategories?: Array<{ category: string; amount: number }>;
}

/**
 * Result of chart data processing
 */
export interface ChartProcessingResult {
  chartData: ProcessedChartItem[];
  trend: number;
  average: number;
  topCategories: Array<{ category: string; amount: number }>;
}

/**
 * Options for grouping transactions
 */
export interface GroupingOptions {
  period: 'week' | 'month' | 'quarter' | 'year';
  includeCategoryBreakdown?: boolean;
  maxTopCategories?: number;
  includeTrend?: boolean;
}

/**
 * Map period type to appropriate grouping
 */
const periodMappings: Record<string, GroupingPeriod> = {
  'week': 'day',
  'month': 'week',
  'quarter': 'month',
  'year': 'month'
};

/**
 * Group transactions by time period
 */
export function groupTransactionsByPeriod(
  transactions: Transaction[],
  groupBy: GroupingPeriod
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>();
  
  if (!transactions || transactions.length === 0) {
    return grouped;
  }
  
  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    let key: string;
    
    // Create the appropriate date key based on the grouping period
    switch (groupBy) {
      case 'day':
        key = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        // Get the start of the week (Sunday)
        const startOfWeek = new Date(txDate);
        startOfWeek.setDate(txDate.getDate() - txDate.getDay());
        key = startOfWeek.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = `${txDate.getFullYear()}`;
        break;
      default:
        key = txDate.toISOString().split('T')[0];
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    
    grouped.get(key)?.push(tx);
  });
  
  return grouped;
}

/**
 * Get top spending categories for a set of transactions
 */
export function getTopCategoriesForTransactions(
  transactions: Transaction[],
  maxCategories: number = 3
): Array<{ category: string; amount: number }> {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  // Group by category
  const categoryMap = new Map<string, number>();
  
  transactions.forEach(tx => {
    if (!tx.category) return;
    
    const category = tx.category || 'Uncategorized';
    const existingAmount = categoryMap.get(category) || 0;
    categoryMap.set(category, existingAmount + tx.amount);
  });
  
  // Convert to array and sort by amount (descending)
  return Array.from(categoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, maxCategories);
}

/**
 * Format a period key for display
 */
export function formatPeriodKey(key: string, groupBy: GroupingPeriod): string {
  switch (groupBy) {
    case 'day':
      return new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    case 'week': {
      const startDate = new Date(key);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      return `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { day: 'numeric' })}`;
    }
    case 'month': {
      const [year, month] = key.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    }
    case 'year':
      return key;
    default:
      return key;
  }
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Process transactions for chart visualization
 */
export function processTransactionsForChart(
  transactions: Transaction[],
  options: GroupingOptions
): ChartProcessingResult {
  if (!transactions || transactions.length === 0) {
    return { 
      chartData: [], 
      trend: 0, 
      average: 0,
      topCategories: [] 
    };
  }
  
  // Determine the grouping period based on selected time frame
  const groupBy = periodMappings[options.period] || 'month';
  
  // Group transactions by date
  const groupedTransactions = groupTransactionsByPeriod(transactions, groupBy as GroupingPeriod);
  
  // Get top categories for the full dataset
  const allTopCategories = getTopCategoriesForTransactions(
    transactions, 
    options.maxTopCategories || 3
  );
  
  // Get all keys and sort them chronologically
  const sortedKeys = Array.from(groupedTransactions.keys()).sort();
  
  // Process each time period
  const processedData = sortedKeys.map(key => {
    const periodTransactions = groupedTransactions.get(key) || [];
    const total = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    const result: ProcessedChartItem = {
      period: formatPeriodKey(key, groupBy as GroupingPeriod),
      amount: total,
      originalKey: key,
    };
    
    // Add category breakdown if requested
    if (options.includeCategoryBreakdown) {
      result.topCategories = getTopCategoriesForTransactions(
        periodTransactions, 
        options.maxTopCategories || 3
      );
    }
    
    return result;
  });
  
  // Calculate trend if requested and if we have enough data
  let trend = 0;
  if (options.includeTrend !== false && processedData.length >= 2) {
    const currentAmount = processedData[processedData.length - 1].amount;
    const previousAmount = processedData[processedData.length - 2].amount;
    trend = calculatePercentageChange(currentAmount, previousAmount);
  }
  
  // Calculate average
  const average = processedData.length > 0
    ? processedData.reduce((sum, item) => sum + item.amount, 0) / processedData.length
    : 0;
  
  return {
    chartData: processedData,
    trend,
    average,
    topCategories: allTopCategories
  };
}

/**
 * Process pie chart data with consistent formatting
 */
export function processPieChartData(
  transactions: Transaction[],
  groupByField: 'paymentMethod' | 'category' | string,
  displayCurrency: Currency,
  colorPalette: string[] = []
): Array<{ name: string; value: number; color: string }> {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  // Default colors if none provided
  const colors = colorPalette.length > 0 ? colorPalette : [
    '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
    '#6366F1', '#EF4444', '#14B8A6', '#F97316', '#0EA5E9'
  ];
  
  // Group and sum transactions
  const groupMap = new Map<string, number>();
  
  transactions.forEach(tx => {
    try {
      // Determine the group key based on the field
      let keyName = 'Unknown';
      
      if (groupByField === 'paymentMethod' && tx.paymentMethod) {
        keyName = tx.paymentMethod.name;
      } else if (groupByField === 'category') {
        keyName = tx.category || 'Uncategorized';
      } else if (tx[groupByField as keyof Transaction]) {
        keyName = String(tx[groupByField as keyof Transaction]);
      }
      
      // Convert amount to display currency if needed
      let amount = tx.amount;
      if (tx.currency !== displayCurrency) {
        amount = convertCurrency(
          tx.amount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
      }
      
      // Add to group total
      const current = groupMap.get(keyName) || 0;
      groupMap.set(keyName, current + amount);
      
    } catch (error) {
      console.error(`Error processing transaction for ${groupByField}:`, error);
    }
  });
  
  // Convert to array and add colors
  return Array.from(groupMap.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }))
    .sort((a, b) => b.value - a.value);
}
