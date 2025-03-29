// src/hooks/dashboard/useSummaryCalculator.ts
import { useMemo } from 'react';
import { Transaction, Currency } from '@/types';
import { SummaryDataProcessor, DateRange, SummaryData } from '@/utils/SummaryDataProcessor';

/**
 * Enhanced hook for calculating summary data using the updated SummaryDataProcessor
 * Ensures consistent payment method ranking across different display currencies
 */
export const useSummaryCalculator = (
  transactions: Transaction[],
  displayCurrency: Currency,
  activeTab: string,
  useStatementMonth: boolean,
  statementCycleDay: number,
  previousPeriodTransactions: Transaction[] = []
) => {
  // Generate date ranges based on current date and selected options
  const dateRanges = useMemo(() => {
    return SummaryDataProcessor.generateDateRanges(useStatementMonth, statementCycleDay);
  }, [useStatementMonth, statementCycleDay]);

  // Filter transactions based on active tab and statement cycle
  const filteredTransactions = useMemo(() => {
    // No need to filter if there are no transactions
    if (!transactions.length) return [];
    
    // If statement cycle is enabled, apply statement cycle filter regardless of tab
    if (useStatementMonth && dateRanges.statement) {
      return transactions.filter(tx => {
        const txDate = new Date(tx.date);
        const range = dateRanges.statement as DateRange;
        return txDate >= range.start && txDate <= range.end;
      });
    }
    
    // Regular tab-based filtering
    switch (activeTab) {
      case 'thisMonth': {
        const range = dateRanges.thisMonth as DateRange;
        return transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= range.start && txDate <= range.end;
        });
      }
      case 'lastMonth': {
        const range = dateRanges.lastMonth as DateRange;
        return transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= range.start && txDate <= range.end;
        });
      }
      case 'lastThreeMonths': {
        const threeMonthsAgo = dateRanges.threeMonthsAgo as Date;
        return transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= threeMonthsAgo;
        });
      }
      case 'thisYear': {
        const range = dateRanges.thisYear as DateRange;
        return transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= range.start && txDate <= range.end;
        });
      }
      default:
        return transactions;
    }
  }, [transactions, activeTab, useStatementMonth, dateRanges]);

  // Create the summary data processor instance
  const processor = useMemo(() => {
    return new SummaryDataProcessor(filteredTransactions, displayCurrency, previousPeriodTransactions);
  }, [filteredTransactions, displayCurrency, previousPeriodTransactions]);

  // Calculate summary data with additional validation
  const summaryData = useMemo<SummaryData>(() => {
    const data = processor.getSummaryData();
    
    // Additional validation for topPaymentMethod to ensure it's always defined when available
    if (!data.topPaymentMethod && data.paymentMethodChartData.length > 0) {
      data.topPaymentMethod = {
        name: data.paymentMethodChartData[0].name,
        value: data.paymentMethodChartData[0].value
      };
    }
    
    return data;
  }, [processor]);

  return {
    summaryData,
    filteredTransactions,
    processor
  };
};
