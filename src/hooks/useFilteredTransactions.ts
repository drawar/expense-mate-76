// hooks/useFilteredTransactions.ts
import { useMemo } from "react";
import { Transaction } from "@/types";
import { TimeframeTab, filterTransactionsByTimeframe } from "@/utils/transactionProcessor";
import { getPreviousTimeframe } from "@/utils/dashboardUtils";

export function useFilteredTransactions(
  transactions: Transaction[],
  timeframe: TimeframeTab,
  useStatementMonth: boolean,
  statementCycleDay: number,
  lastUpdate?: number // Optional dependency to force recalculation
) {
  // Get filtered transactions for current timeframe
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByTimeframe(
      transactions,
      timeframe,
      useStatementMonth,
      statementCycleDay
    );
  }, [
    transactions, 
    timeframe, 
    useStatementMonth, 
    statementCycleDay,
    lastUpdate // Include lastUpdate to force recalculation when data is refreshed
  ]);
  
  // Get filtered transactions for previous timeframe (for comparison)
  const previousPeriodTransactions = useMemo(() => {
    // Get the appropriate previous timeframe for comparison
    const previousTimeframe = getPreviousTimeframe(timeframe);
    
    return filterTransactionsByTimeframe(
      transactions,
      previousTimeframe,
      useStatementMonth,
      statementCycleDay
    );
  }, [
    transactions, 
    timeframe, 
    useStatementMonth, 
    statementCycleDay
  ]);

  return {
    filteredTransactions,
    previousPeriodTransactions
  };
}
