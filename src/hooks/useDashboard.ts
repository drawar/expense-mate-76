
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
    calculateVelocity = false,
    lastUpdate = Date.now() // Add lastUpdate with default
  } = options;

  /**
   * Use a consistent chart period instead of deriving it from timeframe filter
   * This separation allows timeframe to control date range and chart period
   * to control visualization granularity independently
   */
  const chartPeriod = 'month' as const; // Fixed value for type safety

  /**
   * Step 2: Filter transactions - only recalculate when filter criteria change
   * Performance improvement: we don't recompute this when only display currency changes
   */
  const filteredTransactions = useMemo(() => {
    // Early return for empty transactions to avoid unnecessary processing
    if (!transactions.length) return [];
    
    console.log(`Filtering ${transactions.length} transactions for timeframe ${timeframe}`);
    
    return filterTransactionsByTimeframe(
      transactions,
      timeframe,
      useStatementMonth,
      statementCycleDay
    );
  }, [transactions, timeframe, useStatementMonth, statementCycleDay, lastUpdate]);

  /**
   * Step 3: Generate comparison data - separating this from other calculations
   * allows it to be recalculated independently
   */
  const filteredPreviousPeriodTransactions = useMemo(() => {
    if (!transactions.length) return [];
    
    if (previousPeriodTransactions.length > 0) {
      return filterTransactionsByTimeframe(
        previousPeriodTransactions,
        timeframe,
        useStatementMonth,
        statementCycleDay
      );
    } else {
      const prevTimeframe = getPreviousTimeframe(timeframe);
      return filterTransactionsByTimeframe(
        transactions,
        prevTimeframe,
        useStatementMonth,
        statementCycleDay
      );
    }
  }, [previousPeriodTransactions, transactions, timeframe, useStatementMonth, statementCycleDay, lastUpdate]);

  /**
   * Step 4: Calculate primary metrics only when filtered data or currency changes
   */
  const basicMetrics = useMemo(() => {
    // Skip expensive calculations for empty datasets
    if (!filteredTransactions.length) {
      return {
        totalExpenses: 0,
        transactionCount: 0,
        averageAmount: 0,
        totalRewardPoints: 0,
        percentageChange: 0,
        hasEnoughData: false
      };
    }
    
    console.log(`Calculating metrics for ${filteredTransactions.length} filtered transactions`);
    
    // Current period metrics
    const totalExpenses = calculateTotalExpenses(filteredTransactions, displayCurrency);
    const transactionCount = filteredTransactions.length;
    const averageAmount = calculateAverageAmount(totalExpenses, transactionCount);
    const totalRewardPoints = calculateTotalRewardPoints(filteredTransactions);
    
    // Comparison metrics with previous period
    const previousExpenses = calculateTotalExpenses(filteredPreviousPeriodTransactions, displayCurrency);
    const percentageChange = calculatePercentageChange(totalExpenses, previousExpenses);
    
    return {
      totalExpenses,
      transactionCount,
      averageAmount,
      totalRewardPoints,
      percentageChange,
      hasEnoughData: hasEnoughDataForTrends(filteredTransactions)
    };
  }, [filteredTransactions, filteredPreviousPeriodTransactions, displayCurrency, lastUpdate]);

  /**
   * Step 5: Generate chart data using specialized hooks
   * Each chart type now has a separately memoized result
   */
  const paymentMethods = usePieChartData(filteredTransactions, 'paymentMethod', displayCurrency);
  const categories = usePieChartData(filteredTransactions, 'category', displayCurrency);

  /**
   * Memoize options for spending trend data - only recreated when currency changes
   */
  const spendingTrendOptions = useMemo(() => ({
    includeCategoryBreakdown: true,
    displayCurrency
  }), [displayCurrency]);
  
  /**
   * Spending trend calculation now depends only on what it needs
   */
  const spendingTrends = useSpendingTrendData(
    filteredTransactions, 
    chartPeriod, 
    spendingTrendOptions
  );

  /**
   * Optimize optional metrics with proper dependency checking
   */
  const dayOfWeekSpending = useMemo(() => {
    if (!calculateDayOfWeekMetrics || !filteredTransactions.length) return undefined;
    return calculateAverageByDayOfWeek(filteredTransactions, displayCurrency);
  }, [filteredTransactions, displayCurrency, calculateDayOfWeekMetrics, lastUpdate]);

  /**
   * Extract top values with appropriate dependencies
   */
  const topValues = useMemo(() => ({
    paymentMethod: getTopChartItem(paymentMethods),
    category: getTopChartItem(categories)
  }), [paymentMethods, categories]);

  /**
   * Optimize additional metrics calculation
   */
  const additionalMetrics = useMemo(() => {
    const metrics: { transactionVelocity?: number } = {};
    
    if (calculateVelocity && filteredTransactions.length) {
      const daysInPeriod = getDaysInPeriod(timeframe, useStatementMonth, statementCycleDay);
      metrics.transactionVelocity = calculateTransactionVelocity(
        filteredTransactions, 
        daysInPeriod
      );
    }
    
    return metrics;
  }, [filteredTransactions, timeframe, useStatementMonth, statementCycleDay, calculateVelocity, lastUpdate]);

  // Add a console.log to debug the metrics calculation
  console.log('Dashboard metrics calculated:', {
    totalExpenses: basicMetrics.totalExpenses,
    transactionCount: basicMetrics.transactionCount,
    averageAmount: basicMetrics.averageAmount,
    totalRewardPoints: basicMetrics.totalRewardPoints
  });

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
