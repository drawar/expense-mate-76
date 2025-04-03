
// src/hooks/dashboard/useTransactionFiltering.ts
import { useMemo } from "react";
import { Transaction } from "@/types";
import { TimeframeTab } from "@/utils/transactionProcessor";
import { filterTransactionsByTimeframe } from "@/utils/transactionProcessor";

export interface FilterOptions {
  transactions: Transaction[];
  timeframe: TimeframeTab;
  useStatementMonth: boolean;
  statementCycleDay: number;
}

/**
 * Custom hook to filter transactions based on timeframe and statement settings
 * 
 * @param options Configuration options for transaction filtering
 * @returns Object with filtered transactions for current and previous periods
 */
export function useTransactionFiltering(options: FilterOptions) {
  const { transactions, timeframe, useStatementMonth, statementCycleDay } = options;

  // Filter transactions for current period
  const filteredTransactions = useMemo(() => {
    console.info("Filtering for current period:", {
      timeframe,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });
    
    const filtered = filterTransactionsByTimeframe(
      transactions,
      timeframe,
      useStatementMonth,
      statementCycleDay
    );
    
    console.info(`Found ${filtered.length} transactions for current period`);
    return filtered;
  }, [transactions, timeframe, useStatementMonth, statementCycleDay]);

  // Filter transactions for previous period (for comparison)
  const previousPeriodTransactions = useMemo(() => {
    console.info("Filtering for previous period:", {
      timeframe,
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    });
    
    const filtered = filterTransactionsByTimeframe(
      transactions,
      timeframe,
      useStatementMonth,
      statementCycleDay,
      true // This flag gets the previous period
    );
    
    console.info(`Found ${filtered.length} transactions for previous period`);
    return filtered;
  }, [transactions, timeframe, useStatementMonth, statementCycleDay]);

  return {
    filteredTransactions,
    previousPeriodTransactions,
  };
}
