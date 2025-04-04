
// src/hooks/dashboard/useChartDataProcessing.ts
import { useMemo } from "react";
import { Transaction, Currency } from "@/types";
import { ChartDataItem } from "@/types/dashboard";
import { 
  generatePaymentMethodChartData, 
  generateCategoryChartData,
  CHART_COLORS 
} from "@/utils/dashboardCalculations";
import { calculateAverageByDayOfWeek } from "@/utils/dashboardUtils";

export interface ChartDataOptions {
  filteredTransactions: Transaction[];
  displayCurrency: Currency;
  calculateDayOfWeekMetrics?: boolean;
}

/**
 * Custom hook to process transaction data into chart-friendly formats
 */
export function useChartDataProcessing(options: ChartDataOptions) {
  const { filteredTransactions, displayCurrency, calculateDayOfWeekMetrics = false } = options;
  
  return useMemo(() => {
    try {
      if (filteredTransactions.length === 0) {
        return { 
          chartData: {
            paymentMethods: [],
            categories: [],
            dayOfWeekSpending: {},
            spendingTrends: { labels: [], datasets: [] },
          },
          topValues: {}
        };
      }
      
      // Process payment method distribution - ensure data is being generated
      const paymentMethodData = generatePaymentMethodChartData(
        filteredTransactions,
        displayCurrency,
        true // Account for reimbursements
      );
      
      // Process category distribution - ensure data is being generated
      const categoryData = generateCategoryChartData(
        filteredTransactions, 
        displayCurrency,
        true // Account for reimbursements
      );
      
      console.log('Generated chart data:', {
        paymentMethods: paymentMethodData.length,
        categories: categoryData.length
      });
      
      // Process day of week spending if enabled
      const dayOfWeekSpending = calculateDayOfWeekMetrics 
        ? calculateAverageByDayOfWeek(filteredTransactions, displayCurrency)
        : {};
      
      // Process spending trends (simplified, can be expanded later)
      const spendingTrends = processSpendingTrends(filteredTransactions);
      
      // Find top values
      const topValues = {
        paymentMethod: paymentMethodData.length > 0 
          ? { name: paymentMethodData[0].name, value: paymentMethodData[0].value } 
          : undefined,
        category: categoryData.length > 0 
          ? { name: categoryData[0].name, value: categoryData[0].value } 
          : undefined,
      };
      
      return {
        chartData: {
          paymentMethods: paymentMethodData,
          categories: categoryData,
          dayOfWeekSpending,
          spendingTrends,
        },
        topValues,
      };
    } catch (error) {
      console.error("Error processing chart data:", error);
      return { 
        chartData: {
          paymentMethods: [],
          categories: [],
          dayOfWeekSpending: {},
          spendingTrends: { labels: [], datasets: [] },
        },
        topValues: {}
      };
    }
  }, [filteredTransactions, displayCurrency, calculateDayOfWeekMetrics]);
}

// Helper function for processing spending trends data
function processSpendingTrends(transactions: Transaction[]) {
  // This is a placeholder implementation
  // You could implement more sophisticated trend analysis here
  
  // Group transactions by date and sum amounts
  const dateGroups = transactions.reduce((groups, tx) => {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!groups[key]) {
      groups[key] = {
        date: key,
        amount: 0,
      };
    }
    
    groups[key].amount += tx.amount;
    return groups;
  }, {} as Record<string, {date: string, amount: number}>);
  
  // Convert to array and sort by date
  const sortedData = Object.values(dateGroups).sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    labels: sortedData.map(item => item.date),
    datasets: [{
      data: sortedData.map(item => item.amount),
      backgroundColor: CHART_COLORS[0],
    }],
  };
}
