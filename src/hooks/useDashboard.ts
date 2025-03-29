// src/hooks/useDashboard.ts
import { useMemo } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { convertCurrency } from '@/utils/currencyConversion';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '@/utils/categoryMapping';

// Shared color palette for visualizations
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

export type TimeframeTab = 'thisMonth' | 'lastMonth' | 'lastThreeMonths' | 'thisYear';

export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  // Filtered transactions
  transactions: Transaction[];
  
  // Summary metrics
  metrics: {
    totalExpenses: number;
    transactionCount: number;
    averageAmount: number;
    totalRewardPoints: number;
    percentageChange: number;
  };
  
  // Top values
  top: {
    paymentMethod?: { name: string; value: number };
    category?: { name: string; value: number };
  };
  
  // Chart data
  charts: {
    paymentMethods: ChartDataItem[];
    categories: ChartDataItem[];
  };
}

/**
 * Central dashboard hook that handles all data processing for the expense dashboard
 */
export function useDashboard({
  transactions,
  displayCurrency = 'SGD', 
  timeframe = 'thisMonth',
  useStatementMonth = false,
  statementCycleDay = 15,
  previousPeriodTransactions = [],
}: {
  transactions: Transaction[];
  displayCurrency?: Currency;
  timeframe?: TimeframeTab;
  useStatementMonth?: boolean;
  statementCycleDay?: number;
  previousPeriodTransactions?: Transaction[];
}): DashboardData {
  // Step 1: Process transaction categories
  const processedTransactions = useMemo(() => {
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
  }, [transactions]);
  
  // Step 2: Calculate date ranges and filter transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Define date range based on timeframe or statement cycle
    let startDate: Date, endDate: Date;
    
    if (useStatementMonth) {
      // Statement cycle logic
      let startMonth = currentMonth - 1;
      let startYear = currentYear;
      if (startMonth < 0) {
        startMonth = 11;
        startYear -= 1;
      }
      
      startDate = new Date(startYear, startMonth, statementCycleDay);
      endDate = new Date(currentYear, currentMonth, statementCycleDay - 1);
      
      if (statementCycleDay === 1) {
        endDate = new Date(currentYear, currentMonth, 0);
      }
      
      if (endDate > now) {
        endDate = now;
      }
    } else {
      // Regular timeframe logic
      switch (timeframe) {
        case 'thisMonth':
          startDate = new Date(currentYear, currentMonth, 1);
          endDate = new Date(currentYear, currentMonth + 1, 0);
          break;
        case 'lastMonth':
          startDate = new Date(currentYear, currentMonth - 1, 1);
          endDate = new Date(currentYear, currentMonth, 0);
          break;
        case 'lastThreeMonths':
          startDate = new Date(currentYear, currentMonth - 3, now.getDate());
          endDate = now;
          break;
        case 'thisYear':
          startDate = new Date(currentYear, 0, 1);
          endDate = new Date(currentYear, 11, 31);
          break;
        default:
          startDate = new Date(currentYear, currentMonth, 1);
          endDate = new Date(currentYear, currentMonth + 1, 0);
      }
    }
    
    // Filter transactions based on the date range
    return processedTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });
  }, [processedTransactions, timeframe, useStatementMonth, statementCycleDay]);
  
  // Step 3: Calculate total expenses with currency conversion
  const totalExpenses = useMemo(() => {
    return filteredTransactions.reduce((total, tx) => {
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
  }, [filteredTransactions, displayCurrency]);
  
  // Step 4: Calculate total expenses for previous period (for comparison)
  const previousTotalExpenses = useMemo(() => {
    return previousPeriodTransactions.reduce((total, tx) => {
      try {
        const convertedAmount = convertCurrency(
          tx.amount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
        return total + convertedAmount;
      } catch (error) {
        console.error('Error converting currency for previous period:', error);
        return total;
      }
    }, 0);
  }, [previousPeriodTransactions, displayCurrency]);
  
  // Step 5: Calculate percentage change
  const percentageChange = useMemo(() => {
    if (previousTotalExpenses === 0) return totalExpenses > 0 ? 100 : 0;
    return ((totalExpenses - previousTotalExpenses) / previousTotalExpenses) * 100;
  }, [totalExpenses, previousTotalExpenses]);
  
  // Step 6: Calculate transaction metrics
  const transactionMetrics = useMemo(() => {
    const count = filteredTransactions.length;
    const average = count > 0 ? totalExpenses / count : 0;
    
    const points = filteredTransactions.reduce((total, tx) => 
      total + (tx.rewardPoints || 0), 0);
    
    return {
      count,
      average,
      points
    };
  }, [filteredTransactions, totalExpenses]);
  
  // Step 7: Generate payment method data
  const paymentMethodData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];
    
    const methodTotals = new Map<string, number>();
    
    filteredTransactions.forEach(tx => {
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
    
    return Array.from(methodTotals.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, displayCurrency]);
  
  // Step 8: Generate category data
  const categoryData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];
    
    const categoryTotals = new Map<string, number>();
    
    filteredTransactions.forEach(tx => {
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
    
    return Array.from(categoryTotals.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, displayCurrency]);
  
  // Step 9: Get top values
  const topValues = useMemo(() => {
    return {
      paymentMethod: paymentMethodData.length > 0 
        ? { name: paymentMethodData[0].name, value: paymentMethodData[0].value } 
        : undefined,
      category: categoryData.length > 0 
        ? { name: categoryData[0].name, value: categoryData[0].value } 
        : undefined
    };
  }, [paymentMethodData, categoryData]);
  
  // Return the complete dashboard data
  return {
    transactions: filteredTransactions,
    metrics: {
      totalExpenses,
      transactionCount: transactionMetrics.count,
      averageAmount: transactionMetrics.average,
      totalRewardPoints: transactionMetrics.points,
      percentageChange
    },
    top: topValues,
    charts: {
      paymentMethods: paymentMethodData,
      categories: categoryData
    }
  };
}
