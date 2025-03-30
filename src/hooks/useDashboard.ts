// src/hooks/useDashboard.ts
import { useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { DashboardData, DashboardOptions } from '@/types/dashboardTypes';
import { filterTransactionsByTimeframe, getDaysInPeriod } from '@/utils/transactionProcessor';
import { usePieChartData, useSpendingTrendData } from '@/hooks/useChartData';
import {
  calculateTotalExpenses,
  calculatePercentageChange,
  calculateAverageAmount,
  calculateTotalRewardPoints,
  calculateTransactionVelocity,
  calculateAverageByDayOfWeek,
  getTopChartItem,
  getPreviousTimeframe,
  hasEnoughDataForTrends
} from '@/utils/dashboardUtils';

/**
 * Custom hook that processes transaction data and calculates dashboard metrics
 * 
 * This hook is responsible for:
 * 1. Filtering transactions based on selected timeframe
 * 2. Calculating key metrics (expenses, counts, averages)
 * 3. Generating chart data for visualizations
 * 4. Computing comparison metrics with previous periods
 * 
 * @param options Configuration options for dashboard processing
 * @returns Processed dashboard data ready for display
 */
export function useDashboard(options: DashboardOptions): DashboardData {
  // Extract and set default options with destructuring
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

  /**
   * Filter transactions for the current timeframe
   */
  const filteredTransactions = useMemo(() => 
    filterTransactionsByTimeframe(
      transactions,
      timeframe,
      useStatementMonth,
      statementCycleDay
    ),
    [transactions, timeframe, useStatementMonth, statementCycleDay]
  );

  /**
   * Generate previous period transactions for comparison
   */
  const filteredPreviousPeriodTransactions = useMemo(() => {
    if (previousPeriodTransactions.length > 0) {
      // If explicit previous transactions provided, use those
      return filterTransactionsByTimeframe(
        previousPeriodTransactions,
        timeframe,
        useStatementMonth,
        statementCycleDay
      );
    } else {
      // Otherwise, generate from current dataset using an appropriate previous timeframe
      const prevTimeframe = getPreviousTimeframe(timeframe);
      
      return filterTransactionsByTimeframe(
        transactions,
        prevTimeframe,
        useStatementMonth,
        statementCycleDay
      );
    }
  }, [previousPeriodTransactions, transactions, timeframe, useStatementMonth, statementCycleDay]);

  /**
   * Calculate primary financial metrics
   */
  const basicMetrics = useMemo(() => {
    // Current period metrics
    const totalExpenses = calculateTotalExpenses(filteredTransactions, displayCurrency);
    const transactionCount = filteredTransactions.length;
    const averageAmount = calculateAverageAmount(totalExpenses, transactionCount);
    const totalRewardPoints = calculateTotalRewardPoints(filteredTransactions);
    
    // Comparison metrics with previous period
    const previousExpenses = calculateTotalExpenses(filteredPreviousPeriodTransactions, displayCurrency);
    const percentageChange = calculatePercentageChange(totalExpenses, previousExpenses);
    
    // Check if we have enough data for meaningful metrics
    const hasEnoughData = hasEnoughDataForTrends(filteredTransactions);
    
    return {
      totalExpenses,
      transactionCount,
      averageAmount,
      totalRewardPoints,
      percentageChange,
      hasEnoughData
    };
  }, [filteredTransactions, filteredPreviousPeriodTransactions, displayCurrency]);

  /**
   * Generate chart data using specialized hooks
   */
  const paymentMethods = usePieChartData(filteredTransactions, 'paymentMethod', displayCurrency);
  const categories = usePieChartData(filteredTransactions, 'category', displayCurrency);
  
  /**
   * Generate spending trend data
   */
  const spendingTrends = useMemo(() => {
    // Map dashboard timeframe filter to chart period grouping
    const periodMapping: Record<string, 'week' | 'month' | 'quarter' | 'year'> = {
      'thisMonth': 'week',      // For current month view, group by week
      'lastMonth': 'week',      // For last month view, group by week
      'lastThreeMonths': 'month', // For quarterly view, group by month
      'thisYear': 'month'      // For yearly view, group by month
    };
    
    const chartPeriod = periodMapping[timeframe] || 'month';
    
    return useSpendingTrendData(filteredTransactions, chartPeriod, {
      includeCategoryBreakdown: true,
      displayCurrency
    });
  }, [filteredTransactions, timeframe, displayCurrency]);

  /**
   * Calculate day-of-week spending metrics (optional)
   */
  const dayOfWeekSpending = useMemo(() => {
    if (!calculateDayOfWeekMetrics) return undefined;
    return calculateAverageByDayOfWeek(filteredTransactions, displayCurrency);
  }, [filteredTransactions, displayCurrency, calculateDayOfWeekMetrics]);

  /**
   * Extract top values from chart data for summary display
   */
  const topValues = useMemo(() => {
    return {
      paymentMethod: getTopChartItem(paymentMethods),
      category: getTopChartItem(categories)
    };
  }, [paymentMethods, categories]);

  /**
   * Calculate additional optional metrics
   */
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

  /**
   * Combine all calculated data into the final dashboard data structure
   */
  return {
    // Raw filtered transaction data
    filteredTransactions,
    
    // Combined metrics
    metrics: {
      ...basicMetrics,
      ...additionalMetrics
    },
    
    // Top values for summary display
    top: topValues,
    
    // Chart data for visualizations
    charts: {
      paymentMethods,
      categories,
      dayOfWeekSpending,
      spendingTrends
    }
  };
}
