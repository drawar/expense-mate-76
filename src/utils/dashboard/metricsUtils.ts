// utils/dashboard/metricsUtils.ts
import { Transaction, Currency } from "@/types";
import { CurrencyService } from "@/services/CurrencyService";
import { ChartDataItem } from "@/types/dashboard";

/**
 * Utility functions for calculating dashboard metrics
 */
export const metricsUtils = {
  /**
   * Calculate all dashboard metrics in a single pass
   */
  calculateMetrics(
    currentTransactions: Transaction[],
    previousTransactions: Transaction[],
    displayCurrency: Currency
  ): {
    totalExpenses: number;
    transactionCount: number;
    averageAmount: number;
    totalRewardPoints: number;
    percentageChange: number;
    totalReimbursed: number;
    netExpenses: number;
  } {
    // Base case for empty data
    if (currentTransactions.length === 0) {
      return {
        totalExpenses: 0,
        transactionCount: 0,
        averageAmount: 0,
        totalRewardPoints: 0,
        percentageChange: 0,
        totalReimbursed: 0,
        netExpenses: 0
      };
    }

    // Calculate current period metrics
    const totalExpenses = this.calculateTotalExpenses(currentTransactions, displayCurrency);
    const totalReimbursed = this.calculateTotalReimbursed(currentTransactions, displayCurrency);
    const netExpenses = totalExpenses - totalReimbursed;
    
    // Calculate previous period metrics
    const previousTotalExpenses = this.calculateTotalExpenses(previousTransactions, displayCurrency);
    const previousTotalReimbursed = this.calculateTotalReimbursed(previousTransactions, displayCurrency);
    const previousNetExpenses = previousTotalExpenses - previousTotalReimbursed;
    
    // Calculate percentage change
    const percentageChange = this.calculatePercentageChange(netExpenses, previousNetExpenses);
    
    // Calculate other metrics
    const averageAmount = this.calculateAverageAmount(currentTransactions, displayCurrency);
    const totalRewardPoints = this.calculateTotalRewardPoints(currentTransactions);
    
    return {
      totalExpenses,
      transactionCount: currentTransactions.length,
      averageAmount,
      totalRewardPoints,
      percentageChange,
      totalReimbursed,
      netExpenses
    };
  },

  /**
   * Calculate total expenses with currency conversion
   */
  calculateTotalExpenses(
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
  },

  /**
   * Calculate total reimbursed amount with currency conversion
   */
  calculateTotalReimbursed(
    transactions: Transaction[],
    displayCurrency: Currency
  ): number {
    return transactions.reduce((total, tx) => {
      try {
        if (!tx.reimbursementAmount) return total;

        const convertedAmount = CurrencyService.convert(
          tx.reimbursementAmount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
        return total + convertedAmount;
      } catch (error) {
        console.error("Error converting reimbursement currency:", error);
        return total;
      }
    }, 0);
  },

  /**
   * Calculate percentage change between two values
   * Fixed to handle special cases properly
   */
  calculatePercentageChange(
    current: number,
    previous: number
  ): number {
    // If both values are zero, there's no change (0%)
    if (current === 0 && previous === 0) return 0;
    
    // If previous value is zero but current is not, we need special handling
    if (previous === 0) {
      // Instead of infinity or 100%, return a large but reasonable number
      return current > 0 ? 100 : -100;
    }
    
    // Normal case: calculate percent change
    return ((current - previous) / Math.abs(previous)) * 100;
  },
  
  /**
   * Calculate average transaction amount
   */
  calculateAverageAmount(
    transactions: Transaction[],
    displayCurrency: Currency
  ): number {
    const totalAmount = this.calculateTotalExpenses(transactions, displayCurrency);
    return transactions.length > 0 ? totalAmount / transactions.length : 0;
  },
  
  /**
   * Calculate total reward points
   */
  calculateTotalRewardPoints(
    transactions: Transaction[]
  ): number {
    return transactions.reduce((total, tx) => total + (tx.rewardPoints || 0), 0);
  },

  /**
   * Calculate transaction velocity (rate of transactions over time)
   */
  calculateTransactionVelocity(
    transactionCount: number,
    days: number
  ): number {
    if (transactionCount === 0 || days === 0) return 0;
    return transactionCount / days;
  },

  /**
   * Get the top item from chart data
   */
  getTopChartItem(
    chartData: ChartDataItem[]
  ): { name: string; value: number } | undefined {
    return chartData.length > 0
      ? { name: chartData[0].name, value: chartData[0].value }
      : undefined;
  },

  /**
   * Calculate average spend by day of week
   */
  calculateAverageByDayOfWeek(
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
};
