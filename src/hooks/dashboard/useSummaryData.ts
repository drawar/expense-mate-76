
import { useMemo, useCallback } from 'react';
import { Transaction, Currency, PaymentMethod } from '@/types';
import { calculateTotalRewardPoints } from '@/utils/rewards/rewardPoints';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '@/utils/categoryMapping';
import { convertCurrency } from '@/utils/currencyConversion';

// Color palette for charts - defining outside component prevents recreation
export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#4BC0C0', '#FF6B6B', '#6B8E23'];

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
  // Process transactions to ensure categories are set
  // Optimize: Cache processed transactions with category info
  const processedTransactions = useMemo(() => {
    // No need to process if there are no transactions
    if (transactions.length === 0) return [];
    
    return transactions.map(tx => {
      // Skip processing if category is already set
      if (tx.category && tx.category !== 'Uncategorized') {
        return tx;
      }
      if (!tx.category || tx.category === 'Uncategorized') {
        let category = 'Uncategorized';
        
        if (tx.merchant.mcc?.code) {
          category = getCategoryFromMCC(tx.merchant.mcc.code);
        } else if (tx.merchant.name) {
          category = getCategoryFromMerchantName(tx.merchant.name) || 'Uncategorized';
        }
        
        return {...tx, category};
      }
      return tx;
    });
  }, [transactions]);
  
  // Filter transactions based on active tab and statement cycle if enabled
  // Optimize: Calculate and cache date ranges to avoid recalculating for each transaction
  const dateRanges = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate all possible date ranges upfront
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0); 
    
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);
    
    const threeMonthsAgo = new Date(currentYear, currentMonth - 3, now.getDate());
    
    const thisYearStart = new Date(currentYear, 0, 1);
    const thisYearEnd = new Date(currentYear, 11, 31);
    
    // Statement date range if enabled
    let statementStart, statementEnd;
    
    if (useStatementMonth) {
      // Start date: statementCycleDay of previous month
      let startMonth = currentMonth - 1;
      let startYear = currentYear;
      if (startMonth < 0) {
        startMonth = 11; // December
        startYear -= 1;
      }
      
      statementStart = new Date(startYear, startMonth, statementCycleDay);
      
      // End date: day before statementCycleDay of current month
      statementEnd = new Date(currentYear, currentMonth, statementCycleDay - 1);
      // If statementCycleDay is 1, set to end of previous month
      if (statementCycleDay === 1) {
        statementEnd.setDate(0); // Last day of previous month
      }
      
      // Ensure end date is not in the future
      if (statementEnd > now) {
        statementEnd = now;
      }
    }
    
    return {
      thisMonth: { start: thisMonthStart, end: thisMonthEnd },
      lastMonth: { start: lastMonthStart, end: lastMonthEnd },
      threeMonthsAgo,
      thisYear: { start: thisYearStart, end: thisYearEnd },
      statement: useStatementMonth ? { start: statementStart, end: statementEnd } : null
    };
  }, [useStatementMonth, statementCycleDay]);

  // Filter transactions based on active tab or statement cycle
  const filteredTransactions = useMemo(() => {
    // No need to filter if there are no transactions
    if (processedTransactions.length === 0) return [];
    
    // If statement cycle is enabled, apply statement cycle filter regardless of tab
    if (useStatementMonth && dateRanges.statement) {
      return processedTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= dateRanges.statement.start && txDate <= dateRanges.statement.end;
      });
    }
    
    // Regular tab-based filtering
    return processedTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      
      switch (activeTab) {
        case 'thisMonth': 
          return txDate >= dateRanges.thisMonth.start && txDate <= dateRanges.thisMonth.end;
        case 'lastMonth':
          return txDate >= dateRanges.lastMonth.start && txDate <= dateRanges.lastMonth.end;
        case 'lastThreeMonths':
          return txDate >= dateRanges.threeMonthsAgo;
        case 'thisYear':
          return txDate >= dateRanges.thisYear.start && txDate <= dateRanges.thisYear.end;
        default:
          return true;
      }
    });
  }, [activeTab, processedTransactions, useStatementMonth, statementCycleDay]);
  
  // Calculate all summary data in a single pass, with currency conversion
  // Optimize: Refactor to avoid unnecessary calculations
  const summaryData: SummaryData = useMemo(() => {
    // Skip calculations if no transactions to process
    if (filteredTransactions.length === 0) {
      return {
        totalExpenses: 0,
        totalRewardPoints: 0,
        transactionCount: 0,
        averageAmount: 0,
        paymentMethodChartData: [],
        categoryChartData: [],
        topPaymentMethod: undefined
      };
    }
    // Initialize counters and data structures
    const expensesByPaymentMethod = {};
    const expensesByCategory = {};
    let totalExpenses = 0;
    let transactionCount = 0;
    
    // Single loop through filtered transactions to calculate all metrics
    for (const tx of filteredTransactions) {
      transactionCount++;
      
      // Get the original amount in transaction currency
      const originalAmount = tx.amount;
      
      // Convert to display currency
      const convertedAmount = convertCurrency(
        originalAmount, 
        tx.currency as Currency, 
        displayCurrency, 
        tx.paymentMethod
      );
      
      // Calculate total expenses in display currency
      totalExpenses += convertedAmount;
      
      // Expenses by payment method (in display currency)
      const methodName = tx.paymentMethod.name;
      expensesByPaymentMethod[methodName] = (expensesByPaymentMethod[methodName] || 0) + convertedAmount;
      
      // Expenses by category (in display currency)
      const category = tx.category || 'Uncategorized';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + convertedAmount;
    }
    
    // Derived calculations
    const averageAmount = transactionCount ? totalExpenses / transactionCount : 0;
    const totalRewardPoints = calculateTotalRewardPoints(filteredTransactions);
    
    // Create chart data arrays (only once per data change)
    const paymentMethodChartData = Object.entries(expensesByPaymentMethod)
      .map(([name, value], index) => ({
        name,
        value: value as number,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    const categoryChartData = Object.entries(expensesByCategory)
      .map(([name, value], index) => ({
        name,
        value: value as number,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    // Top payment method
    const topPaymentMethod = paymentMethodChartData.length > 0 
      ? { name: paymentMethodChartData[0].name, value: paymentMethodChartData[0].value } 
      : undefined;
    
    return {
      totalExpenses,
      totalRewardPoints,
      transactionCount,
      averageAmount,
      paymentMethodChartData,
      categoryChartData,
      topPaymentMethod
    };
  }, [filteredTransactions, displayCurrency]);
  
  return { filteredTransactions, summaryData };
};
