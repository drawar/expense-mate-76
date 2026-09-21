/**
 * Pure ranking helper for the "recommended payment methods" quick-add
 * pills. Extracted from useRecommendedPaymentMethods so it can be
 * unit-tested without pulling in the useTransactionsQuery → storage
 * import chain.
 *
 * Ranking:
 *   1. transaction count at that merchant (desc)
 *   2. latest use date (desc) for ties
 *
 * Filters out PMs no longer present in the active list
 * (deleted/archived cards).
 */

import type { PaymentMethod, Transaction } from "@/types";

export function rankPaymentMethods(
  matchingTransactions: Transaction[],
  activePaymentMethods: PaymentMethod[],
  topN: number = 3
): PaymentMethod[] {
  if (matchingTransactions.length === 0) return [];

  const stats = new Map<string, { count: number; latestDate: string }>();
  for (const tx of matchingTransactions) {
    const pmId = tx.paymentMethod?.id;
    if (!pmId) continue;
    const current = stats.get(pmId);
    const dateISO =
      typeof tx.date === "string" ? tx.date : new Date(tx.date).toISOString();
    if (!current) {
      stats.set(pmId, { count: 1, latestDate: dateISO });
    } else {
      current.count += 1;
      if (dateISO > current.latestDate) current.latestDate = dateISO;
    }
  }

  const activePmById = new Map(activePaymentMethods.map((pm) => [pm.id, pm]));

  return Array.from(stats.entries())
    .filter(([pmId]) => activePmById.has(pmId))
    .sort((a, b) => {
      if (a[1].count !== b[1].count) return b[1].count - a[1].count;
      return b[1].latestDate.localeCompare(a[1].latestDate);
    })
    .slice(0, topN)
    .map(([pmId]) => activePmById.get(pmId)!)
    .filter(Boolean);
}
