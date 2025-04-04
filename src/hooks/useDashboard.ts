
// src/hooks/useDashboard.ts
import { useState, useMemo, useEffect } from "react";
import { Transaction, Currency } from "@/types";
import { DashboardData, DashboardOptions } from "@/types/dashboard";
import { useTransactionFiltering } from "@/hooks/dashboard/useTransactionFiltering";
import { useMetricsCalculation } from "@/hooks/dashboard/useMetricsCalculation";
import { useChartDataProcessing } from "@/hooks/dashboard/useChartDataProcessing";

/**
 * Custom hook that processes transaction data to build dashboard visualizations and metrics
 *
 * @param options Configuration options for dashboard data
 * @returns Processed dashboard data including metrics, charts, and filtered transactions
 */
export function useDashboard(options: DashboardOptions): {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
} {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Extract configuration from options
  const {
    transactions,
    displayCurrency,
    timeframe,
    useStatementMonth,
    statementCycleDay,
    calculateDayOfWeekMetrics = false,
    calculateVelocity = true,
    lastUpdate,
  } = options;

  const { filterTransactions } = useTransactionFiltering();
  
  // Filter transactions based on selected timeframe
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, {
      timeframe,
      useStatementMonth,
      statementCycleDay,
    });
  }, [transactions, timeframe, useStatementMonth, statementCycleDay, filterTransactions]);
  
  // Filter transactions for previous period
  const previousPeriodTransactions = useMemo(() => {
    // Logic to get previous period transactions would go here
    // For now, returning an empty array as placeholder
    return [];
  }, [transactions, timeframe, useStatementMonth, statementCycleDay]);

  // Calculate dashboard metrics
  const metrics = useMetricsCalculation({
    currentTransactions: filteredTransactions,
    previousTransactions: previousPeriodTransactions,
    displayCurrency,
    calculateVelocity,
  });

  // Process chart data
  const { chartData, topValues } = useChartDataProcessing({
    transactions: filteredTransactions,
    displayCurrency,
    calculateDayOfWeekMetrics,
  });

  // Generate complete dashboard data
  const dashboardData = useMemo<DashboardData | null>(() => {
    try {
      if (filteredTransactions.length === 0) {
        // Return a valid object with empty/zero values for empty state
        return {
          filteredTransactions: [],
          metrics: {
            totalExpenses: 0,
            transactionCount: 0,
            averageAmount: 0,
            totalRewardPoints: 0,
            percentageChange: 0,
            totalReimbursed: 0,
          },
          top: {},
          charts: {
            paymentMethods: [],
            categories: [],
            dayOfWeekSpending: {},
            spendingTrends: { labels: [], datasets: [] },
          },
        };
      }

      if (!metrics || !chartData) {
        throw new Error("Failed to calculate dashboard data");
      }

      return {
        filteredTransactions,
        metrics,
        top: topValues,
        charts: chartData,
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Error generating dashboard data";
      setError(errorMessage);
      console.error("Error generating dashboard data:", e);
      return null;
    }
  }, [filteredTransactions, metrics, chartData, topValues]);

  // Update loading state when data processing is complete
  useEffect(() => {
    setIsLoading(false);
  }, [dashboardData]);

  return { dashboardData, isLoading, error };
}
