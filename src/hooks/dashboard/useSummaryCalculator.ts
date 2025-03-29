// src/hooks/dashboard/useSummaryCalculator.ts
import { useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { SummaryDataProcessor, SummaryData, TimeframeTab } from '@/utils/SummaryDataProcessor';

/**
 * Hook for calculating summary data using the SummaryDataProcessor
 * This hook centralizes all dashboard data processing logic
 */
export const useSummaryCalculator = (
  transactions: Transaction[],
  displayCurrency: Currency,
  activeTab: string,
  useStatementMonth: boolean,
  statementCycleDay: number,
  previousPeriodTransactions: Transaction[] = []
) => {
  // Create a memoized instance of the processor
  const processor = useMemo(() => {
    return new SummaryDataProcessor(
      transactions, 
      displayCurrency,
      previousPeriodTransactions
    );
  }, [transactions, displayCurrency, previousPeriodTransactions]);

  // Filter transactions based on the active tab and statement cycle
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

  // Calculate summary data
  const summaryData = useMemo<SummaryData>(() => {
    return filteredProcessor.getSummaryData();
  }, [filteredProcessor]);

  return {
    summaryData,
    filteredTransactions,
    // Expose processor methods for specialized components
    calculator: {
      getPaymentMethodData: () => filteredProcessor.generatePaymentMethodChartData(),
      getCategoryData: () => filteredProcessor.generateCategoryChartData(),
      getTotalRewardPoints: () => filteredProcessor.calculateTotalRewardPoints(),
      getTopPaymentMethod: () => filteredProcessor.findTopPaymentMethod(),
    }
  };
};
