
import { useMemo } from 'react';
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
  const processedTransactions = useMemo(() => {
    return transactions.map(tx => {
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
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    
    // If statement cycle is enabled, apply statement cycle filter regardless of tab
    if (useStatementMonth) {
      // Calculate statement period
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Start date: statementCycleDay of previous month
      let startMonth = currentMonth - 1;
      let startYear = currentYear;
      if (startMonth < 0) {
        startMonth = 11; // December
        startYear -= 1;
      }
      
      const startDate = new Date(startYear, startMonth, statementCycleDay);
      
      // End date: day before statementCycleDay of current month
      const endDate = new Date(currentYear, currentMonth, statementCycleDay - 1);
      // If statementCycleDay is 1, set to end of previous month
      if (statementCycleDay === 1) {
        endDate.setDate(0); // Last day of previous month
      }
      
      // Ensure end date is not in the future
      const validEndDate = endDate > now ? now : endDate;
      
      console.log(`Statement period: ${startDate.toDateString()} to ${validEndDate.toDateString()}`);
      
      return processedTransactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= startDate && txDate <= validEndDate;
      });
    }
    
    // Regular tab-based filtering
    return processedTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      
      switch (activeTab) {
        case 'thisMonth': 
          return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
          return txDate.getMonth() === lastMonth.getMonth() && txDate.getFullYear() === lastMonth.getFullYear();
        case 'lastThreeMonths':
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3);
          return txDate >= threeMonthsAgo;
        case 'thisYear':
          return txDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [activeTab, processedTransactions, useStatementMonth, statementCycleDay]);
  
  // Calculate all summary data in a single pass, with currency conversion
  const summaryData: SummaryData = useMemo(() => {
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
