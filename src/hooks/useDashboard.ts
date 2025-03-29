// src/hooks/useDashboard.ts
import { useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { DashboardData, DashboardOptions } from '@/types/dashboardTypes';
import { filterTransactionsByTimeframe, getDaysInPeriod } from '@/utils/transactionProcessor';
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
 * Custom hook that processes transaction data and calculates dashboard metrics
 * Implements heavy memoization to avoid unnecessary recalculations
 */
export function useDashboard(options: DashboardOptions): DashboardData {
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

  // Filter transactions based on timeframe
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByTimeframe(
      transactions,
      timeframe,
      useStatementMonth,
      statementCycleDay
    );
  }, [transactions, timeframe, useStatementMonth, statementCycleDay]);

  // Filter previous period transactions if provided
  const filteredPreviousPeriodTransactions = useMemo(() => {
    if (previousPeriodTransactions.length === 0) {
      // If no previous transactions provided, generate them from current dataset
      // based on timeframe (for previous month, quarter, etc.)
      return filterTransactionsByTimeframe(
        transactions,
        timeframe === 'thisMonth' ? 'lastMonth' : 
        timeframe === 'lastMonth' ? 'lastTwoMonths' :
        timeframe === 'lastThreeMonths' ? 'previousThreeMonths' : 'lastYear',
        useStatementMonth,
        statementCycleDay
      );
    }
    
    return filterTransactionsByTimeframe(
      previousPeriodTransactions,
      timeframe,
      useStatementMonth,
      statementCycleDay
    );
  }, [previousPeriodTransactions, transactions, timeframe, useStatementMonth, statementCycleDay]);

  // Step 4: Calculate basic metrics
  const basicMetrics = useMemo(() => {
    const totalExpenses = calculateTotalExpenses(filteredTransactions, displayCurrency);
    const transactionCount = filteredTransactions.length;
    const averageAmount = calculateAverageAmount(totalExpenses, transactionCount);
    const totalRewardPoints = calculateTotalRewardPoints(filteredTransactions);
    
    // Calculate comparison metrics
    const previousExpenses = calculateTotalExpenses(filteredPreviousPeriodTransactions, displayCurrency);
    const percentageChange = calculatePercentageChange(totalExpenses, previousExpenses);
    
    return {
      totalExpenses,
      transactionCount,
      averageAmount,
      totalRewardPoints,
      percentageChange
    };
  }, [filteredTransactions, filteredPreviousPeriodTransactions, displayCurrency]);

  // Step 5: Generate chart data
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

  // Step 6: Get top values
  const topValues = useMemo(() => {
    return {
      paymentMethod: getTopChartItem(chartData.paymentMethods),
      category: getTopChartItem(chartData.categories)
    };
  }, [chartData]);

  // Step 7: Calculate additional metrics if enabled
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

  // Return combined dashboard data
  return {
    filteredTransactions,
    metrics: {
      ...basicMetrics,
      ...additionalMetrics
    },
    top: topValues,
    charts: chartData
  };
}
