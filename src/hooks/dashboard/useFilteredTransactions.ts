// hooks/dashboard/useFilteredTransactions.ts
import { useMemo } from "react";
import { Transaction } from "@/types";
import { TimeframeTab, filterTransactionsByTimeframe } from "@/utils/dashboard";

/**
 * Hook to filter transactions based on user-selected filters
 */
export function useFilteredTransactions(
  transactions: Transaction[],
  activeTab: TimeframeTab,
  useStatementMonth: boolean,
  statementCycleDay: number,
  lastUpdate: number
) {
  // Current period transactions
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByTimeframe(
      transactions,
      activeTab,
      useStatementMonth,
      statementCycleDay,
      false // current period
    );
  }, [transactions, activeTab, useStatementMonth, statementCycleDay, lastUpdate]);

  // Previous period transactions for comparison
  const previousPeriodTransactions = useMemo(() => {
    return filterTransactionsByTimeframe(
      transactions,
      activeTab,
      useStatementMonth,
      statementCycleDay,
      true // previous period
    );
  }, [transactions, activeTab, useStatementMonth, statementCycleDay, lastUpdate]);

  return {
    filteredTransactions,
    previousPeriodTransactions
  };
}
