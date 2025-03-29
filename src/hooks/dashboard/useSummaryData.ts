// src/hooks/dashboard/useSummaryData.ts
import { useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { SummaryDataProcessor, DateRange } from '@/utils/SummaryDataProcessor';

// Use the CHART_COLORS from SummaryDataProcessor for consistency
import { CHART_COLORS as COLORS } from '@/utils/SummaryDataProcessor';

export interface SummaryData {
  totalExpenses: number;
  totalRewardPoints: number;
  transactionCount: number;
  averageAmount: number;
  paymentMethodChartData: Array<{ name: string; value: number; color: string }>;
  categoryChartData: Array<{ name: string; value: number; color: string }>;
  topPaymentMethod: { name: string; value: number } | undefined;
}

export const useSummaryData = (
  transactions: Transaction[],
  displayCurrency: Currency,
  activeTab: string,
  useStatementMonth: boolean,
  statementCycleDay: number
) => {
  // Generate date ranges based on current date and selected options
  const dateRanges = useMemo(() => {
    return SummaryDataProcessor.generateDateRanges(useStatementMonth, statementCycleDay);
  }, [useStatementMonth, statementCycleDay]);

  // Filter transactions based on active tab and statement cycle
  const filteredTransactions = useMemo(() => {
    // No need to filter if there are no transactions
    if (transactions.length === 0) return [];
    
    // If statement cycle is enabled, apply statement cycle filter regardless of tab
    if (useStatementMonth && dateRanges.statement) {
      return transactions.filter(tx => {
        const txDate = new Date(tx.date);
        const range = dateRanges.statement as DateRange;
        return txDate >= range.start && txDate <= range.end;
      });
    }
    
    // Regular tab-based filtering
    return transactions.filter(tx => {
      const txDate = new Date(tx.date);
      
      switch (activeTab) {
        case 'thisMonth': {
          const range = dateRanges.thisMonth as DateRange;
          return txDate >= range.start && txDate <= range.end;
        }
        case 'lastMonth': {
          const range = dateRanges.lastMonth as DateRange;
          return txDate >= range.start && txDate <= range.end;
        }
        case 'lastThreeMonths': {
          const threeMonthsAgo = dateRanges.threeMonthsAgo as Date;
          return txDate >= threeMonthsAgo;
        }
        case 'thisYear': {
          const range = dateRanges.thisYear as DateRange;
          return txDate >= range.start && txDate <= range.end;
        }
        default:
          return true;
      }
    });
  }, [activeTab, transactions, useStatementMonth, dateRanges]);
  
  // Create processor with filtered transactions
  const processor = useMemo(() => {
    return new SummaryDataProcessor(filteredTransactions, displayCurrency);
  }, [filteredTransactions, displayCurrency]);
  
  // Calculate summary data
  const summaryData = useMemo(() => {
    // Instead of calling a method that doesn't exist, use the getSummaryData method
    return processor.getSummaryData();
  }, [processor]);
  
  return { filteredTransactions, summaryData };
};
