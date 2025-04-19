// REFACTORED: src/hooks/useSpendingBreakdown.ts
import { useMemo } from "react";
import { SpendingTracker } from "@/core/analytics/SpendingTracker";
import { SpendingCache } from "@/core/analytics/SpendingCache";
import { MonthlySpendingRepository } from "@/core/analytics/MonthlySpendingRepository";
import { Transaction } from "@/types";
import { calculateDateRange } from "@/utils/date-utils";
import { SpendingFilter } from "@/core/rewards/types";

function getGroupKey(
  tx: Transaction,
  groupBy: "merchant" | "category" | "paymentMethod"
): string {
  switch (groupBy) {
    case "merchant":
      return tx.merchant.name || "Unknown";
    case "category":
      return tx.category || "Uncategorized";
    case "paymentMethod":
      return tx.paymentMethod.id;
  }
}

export function useSpendingBreakdown(
  transactions: Transaction[],
  filter: SpendingFilter,
  groupBy: "merchant" | "category" | "paymentMethod"
) {
  const tracker = useMemo(
    () =>
      new SpendingTracker(new MonthlySpendingRepository(), new SpendingCache()),
    []
  );

  const current = useMemo(() => {
    const { startDate, endDate } = calculateDateRange(filter);
    return transactions
      .filter(
        (tx) =>
          new Date(tx.date) >= startDate.toJSDate() &&
          new Date(tx.date) < endDate.toJSDate()
      )
      .reduce(
        (acc, tx) => {
          const key = getGroupKey(tx, groupBy);
          acc[key] = (acc[key] || 0) + tx.amount;
          return acc;
        },
        {} as Record<string, number>
      );
  }, [transactions, filter, groupBy]);

  const previous = useMemo(() => {
    const prevFilter = { ...filter, scope: "previous" as const };
    const { startDate, endDate } = calculateDateRange(prevFilter);
    return transactions
      .filter(
        (tx) =>
          new Date(tx.date) >= startDate.toJSDate() &&
          new Date(tx.date) < endDate.toJSDate()
      )
      .reduce(
        (acc, tx) => {
          const key = getGroupKey(tx, groupBy);
          acc[key] = (acc[key] || 0) + tx.amount;
          return acc;
        },
        {} as Record<string, number>
      );
  }, [transactions, filter, groupBy]);

  const trends = useMemo(() => {
    const trend: Record<string, number> = {};
    for (const key in current) {
      const prev = previous[key] || 0;
      const curr = current[key];
      trend[key] = prev === 0 ? 1 : (curr - prev) / prev;
    }
    return trend;
  }, [current, previous]);

  return { current, previous, trends };
}
