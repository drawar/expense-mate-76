// src/utils/dashboardUtils.ts
import { Transaction, Currency, PaymentMethod } from "@/types";
import { CurrencyService } from "@/services/CurrencyService";
import { TimeframeTab } from "@/utils/transactionProcessor";

/**
 * Chart data item interface
 * Moved from dashboardCalculations.ts for centralization
 */
export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  highlighted?: boolean;
}

/**
 * Calculate total expenses with currency conversion
 *
 * @param transactions - Transactions to sum
 * @param displayCurrency - Currency to convert amounts to
 * @returns Total expense amount in the display currency
 */
export function calculateTotalExpenses(
  transactions: Transaction[],
  displayCurrency: Currency
): number {
  return transactions.reduce((total, tx) => {
    try {
      const convertedAmount = CurrencyService.convert(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );
      return total + convertedAmount;
    } catch (error) {
      console.error("Error converting currency:", error);
      return total;
    }
  }, 0);
}

/**
 * Calculate total reimbursed amount with currency conversion
 *
 * @param transactions - Transactions to sum reimbursements from
 * @param displayCurrency - Currency to convert amounts to
 * @returns Total reimbursed amount in the display currency
 */
export function calculateTotalReimbursed(
  transactions: Transaction[],
  displayCurrency: Currency
): number {
  return transactions.reduce((total, tx) => {
    try {
      // Skip if no reimbursement amount
      if (!tx.reimbursementAmount) return total;

      const convertedAmount = CurrencyService.convert(
        tx.reimbursementAmount,
        tx.currency as Currency, // Reimbursement is in the same currency as the transaction
        displayCurrency,
        tx.paymentMethod
      );
      return total + convertedAmount;
    } catch (error) {
      console.error("Error converting reimbursement currency:", error);
      return total;
    }
  }, 0);
}

/**
 * Calculate percentage change between two values
 *
 * @param current - Current value
 * @param previous - Previous value to compare against
 * @returns Percentage change (positive for increase, negative for decrease)
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Calculate average transaction amount
 *
 * @param totalAmount - Sum of all transaction amounts
 * @param transactionCount - Number of transactions
 * @returns Average amount per transaction
 */
export function calculateAverageAmount(
  totalAmount: number,
  transactionCount: number
): number {
  return transactionCount > 0 ? totalAmount / transactionCount : 0;
}

/**
 * Calculate total reward points
 *
 * @param transactions - Transactions to sum points from
 * @returns Total reward points earned
 */
export function calculateTotalRewardPoints(
  transactions: Transaction[]
): number {
  return transactions.reduce((total, tx) => total + (tx.rewardPoints || 0), 0);
}

/**
 * Calculate transaction velocity (rate of transactions over time)
 *
 * @param transactionCount - Number of transactions in the period
 * @param days - Number of days in the period
 * @returns Average number of transactions per day
 */
export function calculateTransactionVelocity(
  transactionCount: number,
  days: number
): number {
  if (transactionCount === 0 || days === 0) return 0;
  return transactionCount / days;
}

/**
 * Get the top item from chart data
 *
 * @param chartData - Chart data to analyze
 * @returns The item with the highest value, or undefined if empty
 */
export function getTopChartItem(
  chartData: ChartDataItem[]
): { name: string; value: number } | undefined {
  return chartData.length > 0
    ? { name: chartData[0].name, value: chartData[0].value }
    : undefined;
}

/**
 * Calculate average spend by day of week
 *
 * @param transactions - Transactions to analyze
 * @param displayCurrency - Currency to convert amounts to
 * @returns Object with day names as keys and average spend as values
 */
export function calculateAverageByDayOfWeek(
  transactions: Transaction[],
  displayCurrency: Currency
): Record<string, number> {
  if (transactions.length === 0) return {};

  const dayTotals = new Map<number, number>();
  const dayCounts = new Map<number, number>();
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  transactions.forEach((tx) => {
    try {
      const txDate = new Date(tx.date);
      const dayOfWeek = txDate.getDay(); // 0-6, starting Sunday

      const convertedAmount = CurrencyService.convert(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );

      // If there's a reimbursement, subtract it from the amount
      const netAmount =
        convertedAmount -
        (tx.reimbursementAmount
          ? CurrencyService.convert(
              tx.reimbursementAmount,
              tx.currency as Currency,
              displayCurrency,
              tx.paymentMethod
            )
          : 0);

      dayTotals.set(dayOfWeek, (dayTotals.get(dayOfWeek) || 0) + netAmount);
      dayCounts.set(dayOfWeek, (dayCounts.get(dayOfWeek) || 0) + 1);
    } catch (error) {
      console.error("Error calculating day of week average:", error);
    }
  });

  // Calculate averages
  const result: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const total = dayTotals.get(i) || 0;
    const count = dayCounts.get(i) || 0;
    result[dayNames[i]] = count > 0 ? total / count : 0;
  }

  return result;
}

/**
 * Get the appropriate previous timeframe for comparison
 *
 * @param currentTimeframe - Current selected timeframe
 * @returns The most logical previous timeframe for comparison
 */
export function getPreviousTimeframe(
  currentTimeframe: TimeframeTab
): TimeframeTab {
  switch (currentTimeframe) {
    case "thisMonth":
      return "lastMonth";
    case "lastMonth":
      return "thisMonth"; // Changed from lastThreeMonths to thisMonth since lastThreeMonths is not in TimeframeTab
    case "thisYear":
      return "lastMonth"; // Fallback to last month
    default:
      return "lastMonth";
  }
}

/**
 * Determines if enough data is available for meaningful trend analysis
 *
 * @param transactions - Transactions to analyze
 * @param minimumCount - Minimum number of transactions required
 * @returns Whether there's enough data for trend analysis
 */
export function hasEnoughDataForTrends(
  transactions: Transaction[],
  minimumCount: number = 5
): boolean {
  return transactions.length >= minimumCount;
}
