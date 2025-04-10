// hooks/useDashboardMetrics.ts
import { useMemo } from "react";
import { Transaction, Currency } from "@/types";
import { DashboardData } from "@/types/dashboard";
import { 
  calculateTotalExpenses,
  calculateTotalReimbursed,
  calculatePercentageChange,
  calculateAverageAmount,
  calculateTotalRewardPoints,
  calculateAverageByDayOfWeek
} from "@/utils/dashboardUtils";
import { 
  generatePaymentMethodChartData, 
  generateCategoryChartData 
} from "@/utils/dashboardCalculations";

interface UseDashboardMetricsOptions {
  filteredTransactions: Transaction[];
  previousPeriodTransactions: Transaction[];
  displayCurrency: Currency;
  calculateDayOfWeekMetrics?: boolean;
}

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
      const totalExpenses = calculateTotalExpenses(
        filteredTransactions,
        displayCurrency
      );

      // Calculate total reimbursed amount
      const totalReimbursed = calculateTotalReimbursed(
        filteredTransactions,
        displayCurrency
      );

      // Calculate previous period expenses for comparison
      const previousPeriodExpenses = calculateTotalExpenses(
        previousPeriodTransactions,
        displayCurrency
      );

      // Calculate previous period reimbursements
      const previousPeriodReimbursed = calculateTotalReimbursed(
        previousPeriodTransactions,
        displayCurrency
      );
      
      // Calculate net expenses for both periods
      const netExpenses = totalExpenses - totalReimbursed;
      const previousNetExpenses = previousPeriodExpenses - previousPeriodReimbursed;
      
      // Calculate percentage change from previous period based on net expenses
      const percentageChange = calculatePercentageChange(
        netExpenses,
        previousNetExpenses
      );

      // Calculate average transaction amount
      const averageAmount = calculateAverageAmount(
        filteredTransactions,
        displayCurrency
      );

      // Calculate total reward points earned
      const totalRewardPoints = calculateTotalRewardPoints(filteredTransactions);

      // Generate chart data
      const paymentMethodsChart = generatePaymentMethodChartData(
        filteredTransactions,
        displayCurrency,
        true // Account for reimbursements
      );

      const categoriesChart = generateCategoryChartData(
        filteredTransactions,
        displayCurrency,
        true // Account for reimbursements
      );

      // Calculate day of week spending if enabled
      const dayOfWeekSpending = calculateDayOfWeekMetrics 
        ? calculateAverageByDayOfWeek(filteredTransactions, displayCurrency)
        : {};

      // Get top values
      const topPaymentMethod = paymentMethodsChart.length > 0 
        ? { name: paymentMethodsChart[0].name, value: paymentMethodsChart[0].value } 
        : undefined;

      const topCategory = categoriesChart.length > 0 
        ? { name: categoriesChart[0].name, value: categoriesChart[0].value } 
        : undefined;

      return {
        filteredTransactions,
        metrics: {
          totalExpenses,
          totalReimbursed,
          transactionCount: filteredTransactions.length,
          averageAmount,
          totalRewardPoints,
          percentageChange,
          netExpenses,
        },
        top: {
          paymentMethod: topPaymentMethod,
          category: topCategory,
        },
        charts: {
          paymentMethods: paymentMethodsChart,
          categories: categoriesChart,
          dayOfWeekSpending,
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
