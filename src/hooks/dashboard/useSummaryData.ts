// src/hooks/dashboard/useSummaryData.ts - REPLACEMENT
import { useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { SummaryDataProcessor, TimeframeTab, SummaryData } from '@/utils/SummaryDataProcessor';

// Re-export the color palette from the processor for consistency
export const COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6366F1', // indigo
  '#EF4444', // red
  '#14B8A6', // teal
  '#F97316', // orange
];

/**
 * Hook for processing transaction data into dashboard summary information
 * This is a backward-compatible replacement for the original useSummaryData hook
 * that leverages the improved SummaryDataProcessor class
 */
export const useSummaryData = (
  transactions: Transaction[],
  displayCurrency: Currency,
  activeTab: string,
  useStatementMonth: boolean,
  statementCycleDay: number
): {
  filteredTransactions: Transaction[],
  summaryData: SummaryData
} => {
  // Create and configure the processor
  const processor = useMemo(() => {
    return new SummaryDataProcessor(transactions, displayCurrency);
  }, [transactions, displayCurrency]);
  
  // Apply filtering based on active tab and statement settings
  const filteredProcessor = useMemo(() => {
    return processor.filterTransactions(
      activeTab as TimeframeTab,
      useStatementMonth,
      statementCycleDay
    );
  }, [processor, activeTab, useStatementMonth, statementCycleDay]);
  
  // Get filtered transactions
  const filteredTransactions = useMemo(() => {
    return filteredProcessor.getFilteredTransactions();
  }, [filteredProcessor]);
  
  // Calculate all summary data
  const summaryData = useMemo(() => {
    return filteredProcessor.getSummaryData();
  }, [filteredProcessor]);
  
  return { filteredTransactions, summaryData };
};

export default useSummaryData;
