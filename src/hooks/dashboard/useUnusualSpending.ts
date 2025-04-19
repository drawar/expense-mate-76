// hooks/dashboard/useUnusualSpending.ts
import { useMemo } from "react";
import { Transaction } from "@/types";
import {
  SpendingAnomaly,
  analyzeUnusualSpending,
  AnomalyDetectionOptions,
} from "@/utils/dashboard/unusualSpendingUtils";

/**
 * React hook for detecting unusual spending patterns
 * Provides memoized anomaly detection for UI components
 *
 * @param transactions All transactions to analyze
 * @param options Optional configuration for anomaly detection
 * @returns Object containing anomalies array and alert count
 */
export function useUnusualSpending(
  transactions: Transaction[],
  options?: AnomalyDetectionOptions
): {
  anomalies: SpendingAnomaly[];
  alertCount: number;
} {
  // Use memoization to prevent expensive recalculations on each render
  return useMemo(() => {
    if (!transactions.length) {
      return { anomalies: [], alertCount: 0 };
    }

    // Use our utility function to perform the analysis
    return analyzeUnusualSpending(transactions, 30, 7, options);
  }, [transactions, options]);
}
