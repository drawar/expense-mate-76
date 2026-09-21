/**
 * Recommend the top 3 payment methods historically used at a given
 * merchant. Powers the "quick-add" pill row above the payment-method
 * dropdown.
 *
 * Ranking:
 *   1. transaction count at that merchant (desc)
 *   2. latest use date (desc) for ties
 *
 * Filters out PMs that no longer exist in the current active list
 * (deleted/archived cards).
 *
 * Returns []:
 *   - merchantName is empty / whitespace only
 *   - no prior transactions match this merchant (case-insensitive)
 *   - all matching prior PMs are archived
 */

import { useMemo } from "react";

import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import type { PaymentMethod } from "@/types";
import { rankPaymentMethods } from "@/utils/expense/rankPaymentMethods";

export function useRecommendedPaymentMethods(
  merchantName: string,
  paymentMethods: PaymentMethod[]
): PaymentMethod[] {
  const { data: transactions = [] } = useTransactionsQuery();

  return useMemo(() => {
    const query = (merchantName ?? "").trim().toLowerCase();
    if (query.length === 0) return [];
    if (transactions.length === 0) return [];

    const matching = transactions.filter(
      (tx) => tx.merchant?.name?.toLowerCase() === query
    );
    return rankPaymentMethods(matching, paymentMethods, 3);
  }, [merchantName, transactions, paymentMethods]);
}
