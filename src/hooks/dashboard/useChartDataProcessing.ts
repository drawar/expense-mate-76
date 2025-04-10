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
            spendingTrends: { 
              labels: [], 
              datasets: [{ 
                label: "Expenses",
                data: [],
                backgroundColor: CHART_COLORS[0]
              }] 
            },
          },
          topValues: {}
        };
      }
      
      // Process payment method distribution with reimbursements
      const paymentMethodData = generatePaymentMethodChartData(
        filteredTransactions,
        displayCurrency,
        true // Account for reimbursements
      );
      
      // Process category distribution with reimbursements
      const categoryData = generateCategoryChartData(
        filteredTransactions, 
        displayCurrency,
        true // Account for reimbursements
      );
      
      // Process day of week spending if enabled
      const dayOfWeekSpending = calculateDayOfWeekMetrics 
        ? calculateAverageByDayOfWeek(filteredTransactions, displayCurrency)
        : {};
      
      // Prepare spending trends data
      const spendingTrends = {
        labels: [],
        datasets: [{ 
          label: "Expenses",
          data: [],
          backgroundColor: CHART_COLORS[0]
        }]
      };
      
      // Find top values for summary
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
          spendingTrends: { 
            labels: [], 
            datasets: [{ 
              label: "Expenses",
              data: [],
              backgroundColor: CHART_COLORS[0]
            }] 
          },
        },
        topValues: {}
      };
    }
  }, [filteredTransactions, displayCurrency, calculateDayOfWeekMetrics]);
}
