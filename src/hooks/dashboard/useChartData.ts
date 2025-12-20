// hooks/dashboard/useChartData.ts
import { useMemo } from "react";
import { Transaction, Currency } from "@/types";
import { chartUtils } from "@/utils/dashboard";
import { ChartDataItem } from "@/types/dashboard";
import type { ProcessedChartItem } from "@/utils/chartDataProcessor";

/**
 * Collection of chart data hooks for easy access
 */
export const useChartData = {
  /**
   * Generate pie chart data from transactions
   */
  usePieChartData(
    transactions: Transaction[],
    groupByField: "paymentMethod" | "category",
    displayCurrency: Currency
  ): ChartDataItem[] {
    return useMemo(() => {
      return chartUtils.generatePieChartData(transactions, {
        groupBy: groupByField,
        displayCurrency,
        includeReimbursements: true,
      });
    }, [transactions, groupByField, displayCurrency]);
  },

  /**
   * Generate spending trend data
   */
  useSpendingTrendData(
    transactions: Transaction[],
    period: "day" | "week" | "month" | "quarter" = "month",
    options: {
      includeCategoryBreakdown?: boolean;
      maxTopCategories?: number;
      displayCurrency?: Currency;
    } = {}
  ): {
    data: ProcessedChartItem[];
    trend?: number;
    average?: number;
    topCategories?: Array<{ category: string; amount: number }>;
  } {
    // Extract options with defaults to use as direct dependencies
    const includeCategoryBreakdown = options.includeCategoryBreakdown ?? true;
    const maxTopCategories = options.maxTopCategories ?? 3;
    const displayCurrency = options.displayCurrency ?? "SGD";

    return useMemo(() => {
      return chartUtils.generateTimeSeriesData(transactions, {
        period,
        includeCategoryBreakdown,
        maxTopCategories,
        includeTrend: true,
        displayCurrency,
      });
    }, [
      transactions,
      period,
      includeCategoryBreakdown,
      maxTopCategories,
      displayCurrency,
    ]);
  },
};

/**
 * Hook for generating pie chart data from transactions
 *
 * @param transactions - Array of transactions to visualize
 * @param groupByField - Field to group by (e.g., 'paymentMethod', 'category')
 * @param displayCurrency - Currency to display values in
 * @returns Array of formatted chart data items
 */
export function usePieChartData(
  transactions: Transaction[],
  groupByField: "paymentMethod" | "category",
  displayCurrency: Currency
): ChartDataItem[] {
  return useChartData.usePieChartData(
    transactions,
    groupByField,
    displayCurrency
  );
}

/**
 * Hook for generating spending trend data
 *
 * @param transactions - Transactions to analyze
 * @param period - Time period for grouping (day, week, month, quarter, year)
 * @param options - Additional chart processing options
 * @returns Processed chart data with trends and insights
 */
export function useSpendingTrendData(
  transactions: Transaction[],
  period: "day" | "week" | "month" | "quarter" = "month",
  options: {
    includeCategoryBreakdown?: boolean;
    maxTopCategories?: number;
    displayCurrency?: Currency;
  } = {}
): {
  data: ProcessedChartItem[];
  trend?: number;
  average?: number;
  topCategories?: Array<{ category: string; amount: number }>;
} {
  return useChartData.useSpendingTrendData(transactions, period, options);
}

/**
 * Provide convenience exports from the insight data hooks
 */
export {
  usePaymentMethodOptimization,
  useSavingsPotential,
} from "./useInsightData";
export { useUnusualSpending } from "./useUnusualSpending";
