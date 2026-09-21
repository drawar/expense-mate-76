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
 * Also returns the canonical merchant name from the matched history
 * (so a user who types "uber" gets a "Recently used at Uber" label,
 * not "uber") — falls back to the input when nothing matches.
 *
 * Empty `paymentMethods`:
 *   - merchantName is empty / whitespace only
 *   - no prior transactions match this merchant (case-insensitive)
 *   - all matching prior PMs are archived
 */

import { useMemo } from "react";

import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import type { PaymentMethod } from "@/types";
import { rankPaymentMethods } from "@/utils/expense/rankPaymentMethods";

export interface RecommendedPaymentMethodsResult {
  paymentMethods: PaymentMethod[];
  /**
   * The merchant name as stored in transaction history (most-recent
   * spelling wins). Null when there's no match — caller should fall
   * back to the raw input for display.
   */
  canonicalMerchantName: string | null;
}

export function useRecommendedPaymentMethods(
  merchantName: string,
  paymentMethods: PaymentMethod[]
): RecommendedPaymentMethodsResult {
  const { data: transactions = [] } = useTransactionsQuery();

  return useMemo(() => {
    const query = (merchantName ?? "").trim().toLowerCase();
    if (query.length === 0)
      return { paymentMethods: [], canonicalMerchantName: null };
    if (transactions.length === 0)
      return { paymentMethods: [], canonicalMerchantName: null };

    const matching = transactions.filter(
      (tx) => tx.merchant?.name?.toLowerCase() === query
    );
    if (matching.length === 0)
      return { paymentMethods: [], canonicalMerchantName: null };

    // Canonical spelling = most recent tx's merchant name — if the
    // user renamed the merchant historically, we prefer the newest
    // stored spelling over older variants.
    const sortedByDate = [...matching].sort((a, b) => {
      const dA = typeof a.date === "string" ? a.date : "";
      const dB = typeof b.date === "string" ? b.date : "";
      return dB.localeCompare(dA);
    });
    const canonicalMerchantName =
      sortedByDate[0]?.merchant?.name ?? merchantName;

    return {
      paymentMethods: rankPaymentMethods(matching, paymentMethods, 3),
      canonicalMerchantName,
    };
  }, [merchantName, transactions, paymentMethods]);
}
