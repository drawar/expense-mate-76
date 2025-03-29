// src/hooks/useDashboard.ts
import { useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { DashboardData, DashboardOptions } from '@/types/dashboardTypes';
import { filterTransactionsByTimeframe, getDaysInPeriod, TimeframeTab } from '@/utils/transactionProcessor';
import {
  calculateTotalExpenses,
  calculatePercentageChange,
  calculateAverageAmount,
  calculateTotalRewardPoints,
  calculateTransactionVelocity,
  calculateAverageByDayOfWeek
} from '@/utils/dashboardCalculations';
import { usePieChartData } from '@/hooks/useChartData';

/**
 * Custom hook that processes transaction data and calculates dashboard metrics
 * Uses memoization to avoid unnecessary recalculations
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
  const filteredTransactions = useMemo(() => 
    filterTransactionsByTimeframe(
      transactions,
      timeframe,
      useStatementMonth,
      statementCycleDay
    ),
    [transactions, timeframe, useStatementMonth, statementCycleDay]
  );

  // Filter previous period transactions
  const filteredPreviousPeriodTransactions = useMemo(() => {
    if (previousPeriodTransactions.length === 0) {
      // If no previous transactions provided, generate them from current dataset
      // Make sure we only use valid TimeframeTab values
      let prevTimeframe: TimeframeTab = 'lastMonth';
      
      if (timeframe === 'thisMonth') prevTimeframe = 'lastMonth';
      else if (timeframe === 'lastMonth') prevTimeframe = 'lastThreeMonths';
      else if (timeframe === 'lastThreeMonths') prevTimeframe = 'thisYear';
      else prevTimeframe = 'lastMonth';
        
      return filterTransactionsByTimeframe(
        transactions,
        prevTimeframe,
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

  // Calculate basic metrics
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

  // Use our custom hooks for chart data
  const paymentMethods = usePieChartData(filteredTransactions, 'paymentMethod', displayCurrency);
  const categories = usePieChartData(filteredTransactions, 'category', displayCurrency);

  // Compute day of week spending if requested
  const dayOfWeekSpending = useMemo(() => {
    if (!calculateDayOfWeekMetrics) return undefined;
    return calculateAverageByDayOfWeek(filteredTransactions, displayCurrency);
  }, [filteredTransactions, displayCurrency, calculateDayOfWeekMetrics]);

  // Get top values
  const topValues = useMemo(() => {
    return {
      paymentMethod: paymentMethods.length > 0 
        ? { name: paymentMethods[0].name, value: paymentMethods[0].value } 
        : undefined,
      category: categories.length > 0 
        ? { name: categories[0].name, value: categories[0].value } 
        : undefined
    };
  }, [paymentMethods, categories]);

  // Calculate additional metrics if enabled
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
    charts: {
      paymentMethods,
      categories,
      dayOfWeekSpending
    }
  };
}
