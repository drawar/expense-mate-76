/**
 * useCapUsage Hook
 *
 * React hook that computes cap usage from transactions.
 * Automatically updates when transactions change via React Query.
 *
 * Usage:
 * const { data: capUsages, isLoading } = useCapUsage(paymentMethod, rewardRules);
 */

import { useMemo } from "react";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { PaymentMethod } from "@/types";
import { RewardRule } from "@/core/rewards/types";
import {
  calculateCapUsage,
  CapUsageResult,
} from "@/core/rewards/CapUsageService";

interface UseCapUsageOptions {
  /** Reference date for period calculation (defaults to now) */
  referenceDate?: Date;
  /** Enable/disable the hook */
  enabled?: boolean;
}

interface UseCapUsageResult {
  /** Cap usage data */
  data: CapUsageResult[];
  /** Whether transactions are still loading */
  isLoading: boolean;
  /** Any error from the transactions query */
  error: Error | null;
}

/**
 * Hook to compute cap usage for a payment method's reward rules.
 *
 * Derives cap usage directly from transactions - no separate tracking table.
 * Automatically re-computes when transactions change.
 *
 * @param paymentMethod - The payment method to compute cap usage for
 * @param rewardRules - Reward rules for the payment method's card type
 * @param options - Optional configuration
 * @returns Cap usage data, loading state, and any errors
 */
export function useCapUsage(
  paymentMethod: PaymentMethod | null | undefined,
  rewardRules: RewardRule[],
  options: UseCapUsageOptions = {}
): UseCapUsageResult {
  const { referenceDate = new Date(), enabled = true } = options;

  // Get all transactions from React Query
  const {
    data: allTransactions = [],
    isLoading,
    error,
  } = useTransactionsQuery();

  // Compute cap usage - memoized to avoid recalculation on every render
  const capUsages = useMemo(() => {
    // Don't compute if disabled or no payment method
    if (!enabled || !paymentMethod) {
      return [];
    }

    // Filter rules to only those with caps
    const cappedRules = rewardRules.filter(
      (r) => r.reward.capDuration != null && r.reward.monthlyCap != null
    );

    // Don't compute if no capped rules
    if (cappedRules.length === 0) {
      return [];
    }

    // Filter transactions for this payment method
    const paymentMethodTransactions = allTransactions.filter(
      (tx) => tx.paymentMethod?.id === paymentMethod.id && !tx.is_deleted
    );

    // Calculate cap usage
    return calculateCapUsage(
      paymentMethodTransactions,
      rewardRules,
      paymentMethod,
      referenceDate
    );
  }, [enabled, paymentMethod, rewardRules, allTransactions, referenceDate]);

  return {
    data: capUsages,
    isLoading,
    error: error as Error | null,
  };
}

export default useCapUsage;
