
// src/hooks/dashboard/useChartDataProcessing.ts
import { useMemo } from "react";
import { Transaction, Currency } from "@/types";
import { ChartDataItem } from "@/types/dashboard";
import {
  generatePaymentMethodChartData,
  generateCategoryChartData,
} from "@/utils/dashboardCalculations";
import { calculateAverageByDayOfWeek } from "@/utils/dashboardUtils";
import { getTopChartItem } from "@/utils/dashboardUtils";

export interface ChartDataOptions {
  filteredTransactions: Transaction[];
  displayCurrency: Currency;
  calculateDayOfWeekMetrics?: boolean;
}

export interface TopValues {
  paymentMethod?: { name: string; value: number };
  category?: { name: string; value: number };
}

export interface ProcessedChartData {
  paymentMethods: ChartDataItem[];
  categories: ChartDataItem[];
  dayOfWeekSpending: Record<string, number>;
  spendingTrends: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
    }[];
  };
}

/**
 * Custom hook to process transaction data into chart-ready formats
 * 
 * @param options Configuration options for chart data processing
 * @returns Object with chart data and top values
 */
export function useChartDataProcessing(options: ChartDataOptions) {
  const {
    filteredTransactions,
    displayCurrency,
    calculateDayOfWeekMetrics = false,
  } = options;

  // Process chart data
  const chartData = useMemo<ProcessedChartData | null>(() => {
    try {
      if (filteredTransactions.length === 0) {
        return {
          paymentMethods: [],
          categories: [],
          dayOfWeekSpending: {},
          spendingTrends: { labels: [], datasets: [] },
        };
      }

      // Generate payment method distribution chart data
      const paymentMethods = generatePaymentMethodChartData(
        filteredTransactions,
        displayCurrency
      );

      // Generate category distribution chart data
      const categories = generateCategoryChartData(
        filteredTransactions,
        displayCurrency
      );

      // Calculate day of week spending distribution (optional)
      let dayOfWeekSpending = {};
      if (calculateDayOfWeekMetrics) {
        dayOfWeekSpending = calculateAverageByDayOfWeek(
          filteredTransactions,
          displayCurrency
        );
      }

      // Process spending trends chart data
      const trendData = {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Expenses",
            data: [0, 0, 0, 0, 0, 0],
          }
        ]
      };

      // Create the spending trends chart data structure
      const spendingTrends = {
        labels: trendData.labels || [],
        datasets: trendData.datasets || [],
      };

      return {
        paymentMethods,
        categories,
        dayOfWeekSpending,
        spendingTrends,
      };
    } catch (error) {
      console.error("Error generating chart data:", error);
      return null;
    }
  }, [filteredTransactions, displayCurrency, calculateDayOfWeekMetrics]);

  // Derive top values from chart data
  const topValues = useMemo<TopValues>(() => {
    try {
      if (!chartData || filteredTransactions.length === 0) {
        return {};
      }

      // Get top payment method
      const topPaymentMethod = getTopChartItem(chartData.paymentMethods);

      // Get top category
      const topCategory = getTopChartItem(chartData.categories);

      return {
        paymentMethod: topPaymentMethod,
        category: topCategory,
      };
    } catch (error) {
      console.error("Error finding top values:", error);
      return {};
    }
  }, [chartData, filteredTransactions.length]);

  return { chartData, topValues };
}
