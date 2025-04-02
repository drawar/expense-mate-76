
// src/utils/dashboardCalculations.ts
import { Transaction, Currency } from "@/types";
import {
  calculateTotalExpenses,
  calculatePercentageChange,
  calculateAverageAmount,
  calculateTotalRewardPoints,
  calculateTransactionVelocity,
  calculateAverageByDayOfWeek,
  calculateTotalReimbursed,
  getTopChartItem,
  ChartDataItem,
} from "./dashboardUtils";
import { CurrencyService } from "@/services/CurrencyService";

/**
 * Shared color palette for visualizations
 */
export const CHART_COLORS = [
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6366F1", // indigo
  "#EF4444", // red
  "#14B8A6", // teal
  "#F97316", // orange
];

/**
 * Generate payment method chart data
 * Now accounts for reimbursed amounts
 */
export function generatePaymentMethodChartData(
  transactions: Transaction[],
  displayCurrency: Currency,
  accountForReimbursements: boolean = true
): ChartDataItem[] {
  if (transactions.length === 0) return [];

  const methodTotals = new Map<string, number>();

  // Sum up amounts by payment method
  transactions.forEach((tx) => {
    try {
      const methodName = tx.paymentMethod?.name || "Unknown";
      const convertedAmount = CurrencyService.convert(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );

      // Subtract reimbursement if enabled
      let finalAmount = convertedAmount;
      if (accountForReimbursements && tx.reimbursementAmount) {
        const convertedReimbursement = CurrencyService.convert(
          tx.reimbursementAmount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
        finalAmount -= convertedReimbursement;
      }

      const current = methodTotals.get(methodName) || 0;
      methodTotals.set(methodName, current + finalAmount);
    } catch (error) {
      console.error("Error processing payment method data:", error);
    }
  });

  // Convert to chart data array with colors
  return Array.from(methodTotals.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Generate category chart data
 * Now accounts for reimbursed amounts
 */
export function generateCategoryChartData(
  transactions: Transaction[],
  displayCurrency: Currency,
  accountForReimbursements: boolean = true
): ChartDataItem[] {
  if (transactions.length === 0) return [];

  const categoryTotals = new Map<string, number>();

  // Sum up amounts by category
  transactions.forEach((tx) => {
    try {
      const category = tx.category || "Uncategorized";
      const convertedAmount = CurrencyService.convert(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );

      // Subtract reimbursement if enabled
      let finalAmount = convertedAmount;
      if (accountForReimbursements && tx.reimbursementAmount) {
        const convertedReimbursement = CurrencyService.convert(
          tx.reimbursementAmount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
        finalAmount -= convertedReimbursement;
      }

      const current = categoryTotals.get(category) || 0;
      categoryTotals.set(category, current + finalAmount);
    } catch (error) {
      console.error("Error processing category data:", error);
    }
  });

  // Convert to chart data array with colors
  return Array.from(categoryTotals.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}
