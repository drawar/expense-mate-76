
// src/hooks/dashboard/useMetricsCalculation.ts
import { useMemo } from "react";
import { Transaction, Currency } from "@/types";
import {
  calculateTotalExpenses,
  calculateTotalReimbursed,
  calculatePercentageChange,
  calculateAverageAmount,
  calculateTotalRewardPoints,
  calculateTransactionVelocity,
} from "@/utils/dashboardUtils";

export interface DashboardMetricsOptions {
  filteredTransactions: Transaction[];
  previousPeriodTransactions: Transaction[];
  displayCurrency: Currency;
  calculateVelocity?: boolean;
}

/**
 * Custom hook to calculate dashboard metrics from filtered transactions
 * 
 * @param options Configuration options for metrics calculation
 * @returns Object containing all calculated metrics or null if no data
 */
export function useMetricsCalculation(options: DashboardMetricsOptions) {
  const {
    filteredTransactions,
    previousPeriodTransactions,
    displayCurrency,
    calculateVelocity = true,
  } = options;

  return useMemo(() => {
    try {
      if (filteredTransactions.length === 0) {
        return null;
      }

      // Calculate total expenses for current period
      const totalExpenses = calculateTotalExpenses(
        filteredTransactions,
        displayCurrency
      );

      // Calculate total reimbursed amount if applicable
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

      // Calculate transaction velocity (optional)
      let transactionVelocity = undefined;
      let hasEnoughData = false;

      if (calculateVelocity) {
        const transactionCount = filteredTransactions.length;
        const days = 30; // Assuming 30 days as a default period
        
        transactionVelocity = calculateTransactionVelocity(transactionCount, days);
        hasEnoughData = filteredTransactions.length >= 5; // Basic check for enough data
      }

      return {
        totalExpenses,
        totalReimbursed,
        transactionCount: filteredTransactions.length,
        averageAmount,
        totalRewardPoints,
        percentageChange,
        transactionVelocity,
        hasEnoughData,
        netExpenses,
      };
    } catch (error) {
      console.error("Error calculating dashboard metrics:", error);
      return null;
    }
  }, [filteredTransactions, previousPeriodTransactions, displayCurrency, calculateVelocity]);
}
