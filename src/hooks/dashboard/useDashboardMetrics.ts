// hooks/dashboard/useDashboardMetrics.ts
import { useMemo } from "react";
import { Transaction, Currency } from "@/types";
import { DashboardData } from "@/types/dashboard";
import { metricsUtils, chartUtils } from "@/utils/dashboard";

interface UseDashboardMetricsOptions {
  filteredTransactions: Transaction[];
  previousPeriodTransactions: Transaction[];
  displayCurrency: Currency;
  calculateDayOfWeekMetrics?: boolean;
}

/**
 * Hook to calculate all dashboard metrics and chart data
 */
export function useDashboardMetrics(options: UseDashboardMetricsOptions) {
  const {
    filteredTransactions,
    previousPeriodTransactions,
    displayCurrency,
    calculateDayOfWeekMetrics = false
  } = options;

  // Generate dashboard data from filtered transactions
  const dashboardData = useMemo(() => {
    try {
      if (filteredTransactions.length === 0) {
        return {
          filteredTransactions: [],
          metrics: {
            totalExpenses: 0,
            transactionCount: 0,
            averageAmount: 0,
            totalRewardPoints: 0,
            percentageChange: 0,
            totalReimbursed: 0,
            netExpenses: 0,
          },
          top: {},
          charts: {
            paymentMethods: [],
            categories: [],
            dayOfWeekSpending: {},
            spendingTrends: { 
              labels: [], 
              datasets: [{ 
                label: "Expenses",
                data: [],
                backgroundColor: "#8884d8"
              }] 
            },
          }
        } as DashboardData;
      }

      // Calculate metrics
      const metrics = metricsUtils.calculateMetrics(
        filteredTransactions,
        previousPeriodTransactions,
        displayCurrency
      );

      // Generate chart data for categories
      const categoriesData = chartUtils.generatePieChartData(
        filteredTransactions,
        {
          groupBy: 'category',
          displayCurrency,
          includeReimbursements: true,
          topItemsLimit: 10
        }
      );

      // Generate chart data for payment methods
      const paymentMethodsData = chartUtils.generatePieChartData(
        filteredTransactions,
        {
          groupBy: 'paymentMethod',
          displayCurrency,
          includeReimbursements: true
        }
      );

      // Generate time series data
      const barData = chartUtils.generateTimeSeriesData(
        filteredTransactions,
        {
          period: 'month',
          displayCurrency,
          includeReimbursements: true,
          includeTrend: true
        }
      );

      // Calculate day of week spending if enabled
      const dayOfWeekSpending = calculateDayOfWeekMetrics 
        ? metricsUtils.calculateAverageByDayOfWeek(filteredTransactions, displayCurrency)
        : {};

      // Transform bar data to the expected spendingTrends format
      const spendingTrends = {
        labels: barData.data.map(item => item.period),
        datasets: [
          {
            label: "Expenses",
            data: barData.data.map(item => item.amount),
            backgroundColor: chartUtils.CHART_COLORS[0]
          }
        ]
      };

      // Get top values
      const topCategory = categoriesData.length > 0 ? 
        { name: categoriesData[0].name, value: categoriesData[0].value } : 
        undefined;
        
      const topPaymentMethod = paymentMethodsData.length > 0 ? 
        { name: paymentMethodsData[0].name, value: paymentMethodsData[0].value } : 
        undefined;

      // Create the dashboard data object
      const result: DashboardData = {
        filteredTransactions,
        metrics,
        charts: {
          categories: categoriesData,
          paymentMethods: paymentMethodsData,
          spendingTrends,
          dayOfWeekSpending,
        },
        top: {
          category: topCategory,
          paymentMethod: topPaymentMethod,
        }
      };

      return result;
    } catch (error) {
      console.error("Error generating dashboard data:", error);
      return null;
    }
  }, [filteredTransactions, previousPeriodTransactions, displayCurrency, calculateDayOfWeekMetrics]);

  return {
    dashboardData,
    isLoading: false,
    error: dashboardData ? null : "Failed to calculate dashboard metrics"
  };
}
