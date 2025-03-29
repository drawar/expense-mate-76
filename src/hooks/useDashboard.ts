// src/hooks/useDashboard.ts
import { useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { DashboardData, DashboardOptions, SummaryData } from '@/types/dashboardTypes';

// Import data processing functions
import {
  processCategoriesForTransactions,
  filterTransactionsByTimeframe,
  getDaysInPeriod
} from '@/utils/transactionProcessor';

// Import calculation functions
import {
  calculateTotalExpenses,
  calculatePercentageChange,
  calculateAverageAmount,
  calculateTotalRewardPoints,
  generatePaymentMethodChartData,
  generateCategoryChartData,
  getTopChartItem,
  calculateTransactionVelocity,
  calculateAverageByDayOfWeek
} from '@/utils/dashboardCalculations';

/**
 * Dashboard hook that processes transaction data and calculates metrics
 */
export function useDashboard(options: DashboardOptions): DashboardData & SummaryData {
  // Extract and set default options
  const {
    transactions = [],
    displayCurrency = 'SGD',
    timeframe = 'thisMonth',
    useStatementMonth = false,
    statementCycleDay = 15,
    previousPeriodTransactions = [],
    calculateDayOfWeekMetrics = false,
    calculateVelocity = false
  } = options;

  // Step 1: Process categories for all transactions
  const processedTransactions = useMemo(() => {
    return processCategoriesForTransactions(transactions);
  }, [transactions]);

  // Step 2: Filter transactions based on timeframe
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByTimeframe(
      processedTransactions,
      timeframe,
      useStatementMonth,
      statementCycleDay
    );
  }, [processedTransactions, timeframe, useStatementMonth, statementCycleDay]);

  // Step 3: Calculate basic metrics
  const basicMetrics = useMemo(() => {
    const totalExpenses = calculateTotalExpenses(filteredTransactions, displayCurrency);
    const transactionCount = filteredTransactions.length;
    const averageAmount = calculateAverageAmount(totalExpenses, transactionCount);
    const totalRewardPoints = calculateTotalRewardPoints(filteredTransactions);
    
    // Calculate comparison metrics
    const previousExpenses = calculateTotalExpenses(previousPeriodTransactions, displayCurrency);
    const percentageChange = calculatePercentageChange(totalExpenses, previousExpenses);
    
    return {
      totalExpenses,
      transactionCount,
      averageAmount,
      totalRewardPoints,
      percentageChange
    };
  }, [filteredTransactions, previousPeriodTransactions, displayCurrency]);

  // Step 4: Generate chart data
  const chartData = useMemo(() => {
    const paymentMethods = generatePaymentMethodChartData(filteredTransactions, displayCurrency);
    const categories = generateCategoryChartData(filteredTransactions, displayCurrency);
    
    // Optional day of week spending pattern
    let dayOfWeekSpending;
    if (calculateDayOfWeekMetrics) {
      dayOfWeekSpending = calculateAverageByDayOfWeek(filteredTransactions, displayCurrency);
    }
    
    return {
      paymentMethods,
      categories,
      dayOfWeekSpending
    };
  }, [filteredTransactions, displayCurrency, calculateDayOfWeekMetrics]);

  // Step 5: Get top values
  const topValues = useMemo(() => {
    return {
      paymentMethod: getTopChartItem(chartData.paymentMethods),
      category: getTopChartItem(chartData.categories)
    };
  }, [chartData]);

  // Step 6: Calculate additional metrics if enabled
  const additionalMetrics = useMemo(() => {
    const metrics: { transactionVelocity?: number } = {};
    
    if (calculateVelocity) {
      const daysInPeriod = getDaysInPeriod(timeframe, useStatementMonth, statementCycleDay);
      metrics.transactionVelocity = calculateTransactionVelocity(
        filteredTransactions, 
        daysInPeriod
      );
    }
    
    return metrics;
  }, [filteredTransactions, timeframe, useStatementMonth, statementCycleDay, calculateVelocity]);

  // Combine all data into the DashboardData interface
  const dashboardData: DashboardData = {
    filteredTransactions,
    metrics: {
      ...basicMetrics,
      ...additionalMetrics
    },
    top: topValues,
    charts: chartData
  };

  // Also return legacy SummaryData interface properties for backward compatibility
  return {
    ...dashboardData,
    // Legacy structure expected by existing components
    totalExpenses: basicMetrics.totalExpenses,
    transactionCount: basicMetrics.transactionCount,
    averageAmount: basicMetrics.averageAmount,
    topPaymentMethod: topValues.paymentMethod,
    totalRewardPoints: basicMetrics.totalRewardPoints,
    paymentMethodChartData: chartData.paymentMethods,
    categoryChartData: chartData.categories,
    percentageChange: basicMetrics.percentageChange,
    transactions: filteredTransactions
  };
}
