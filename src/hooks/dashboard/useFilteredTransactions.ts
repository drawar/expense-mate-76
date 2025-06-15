
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
  // Add debugging to see what transactions we're working with
  console.log('useFilteredTransactions input:', {
    transactionCount: transactions.length,
    activeTab,
    useStatementMonth,
    statementCycleDay,
    firstFewTransactions: transactions.slice(0, 3).map(t => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      merchant: t.merchant?.name
    }))
  });

  // Current period transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      console.log('No transactions to filter');
      return [];
    }

    const filtered = filterTransactionsByTimeframe(
      transactions,
      activeTab,
      useStatementMonth,
      statementCycleDay,
      false // current period
    );

    console.log('Filtered transactions result:', {
      originalCount: transactions.length,
      filteredCount: filtered.length,
      timeframe: activeTab
    });

    return filtered;
  }, [transactions, activeTab, useStatementMonth, statementCycleDay, lastUpdate]);

  // Previous period transactions for comparison
  const previousPeriodTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

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
