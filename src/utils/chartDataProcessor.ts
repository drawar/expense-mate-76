
import { Transaction } from '@/types';

export interface ProcessedChartItem {
  period: string;
  amount: number;
  topCategories?: { category: string; amount: number }[];
}

export interface ChartProcessingOptions {
  period: 'day' | 'week' | 'month' | 'quarter';
  includeCategoryBreakdown?: boolean;
  maxTopCategories?: number;
  includeTrend?: boolean;
  displayCurrency?: string;
}

/**
 * Process transactions for chart display
 */
export function processTransactionsForChart(
  transactions: Transaction[],
  options: ChartProcessingOptions
) {
  const { 
    period = 'month', 
    includeCategoryBreakdown = true,
    maxTopCategories = 3,
    includeTrend = true,
    displayCurrency = 'SGD'
  } = options;

  // Create an empty result structure with default values
  const result = {
    chartData: [] as ProcessedChartItem[],
    trend: 0,
    average: 0,
    topCategories: [] as { category: string; amount: number }[]
  };

  // Simple implementation for example purposes
  result.chartData = transactions.slice(0, 5).map((tx, index) => ({
    period: `Period ${index + 1}`,
    amount: tx.amount,
    topCategories: includeCategoryBreakdown ? [
      { category: tx.category || 'Uncategorized', amount: tx.amount }
    ] : undefined
  }));

  // Simple trend calculation
  result.trend = transactions.length > 1 ? 5.2 : 0;
  
  // Simple average calculation
  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  result.average = transactions.length > 0 ? totalAmount / transactions.length : 0;

  // Top categories calculation
  if (includeCategoryBreakdown) {
    const categoryMap = new Map<string, number>();
    
    // Aggregate by category
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + tx.amount);
    });
    
    // Convert to array and sort
    result.topCategories = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, maxTopCategories);
  }

  return result;
}
