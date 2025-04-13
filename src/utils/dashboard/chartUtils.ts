// utils/dashboard/chartUtils.ts
import { Transaction, Currency } from '@/types';
import { CurrencyService } from '@/services/currency';
import { format } from 'date-fns';
import { CHART_COLORS } from './constants';
import { 
  ChartProcessingOptions, 
  ProcessedChartItem, 
  TimeSeriesResult 
} from './types';
import { metricsUtils } from './metricsUtils';
import { ChartDataItem } from "@/types/dashboard";

/**
 * Utility functions for processing transaction data into chart-friendly formats
 */
export const chartUtils = {
  /**
   * Reference to the color palette for charts
   */
  CHART_COLORS,

  /**
   * Generate pie chart data from transactions
   */
  generatePieChartData(
    transactions: Transaction[],
    options: {
      groupBy: 'category' | 'paymentMethod';
      displayCurrency: Currency;
      includeReimbursements?: boolean;
      topItemsLimit?: number;
    }
  ): ChartDataItem[] {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const { 
      groupBy = 'category', 
      displayCurrency, 
      includeReimbursements = true, 
      topItemsLimit = 0 
    } = options;
    
    const groups = new Map<string, number>();

    // Aggregate values by the specified grouping field
    transactions.forEach((tx) => {
      let key = "Uncategorized";

      if (groupBy === "paymentMethod") {
        key = tx.paymentMethod?.name || "Unknown";
      } else if (groupBy === "category") {
        key = tx.category || "Uncategorized";
      }

      // Convert amount to display currency
      const convertedAmount = CurrencyService.convert(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );

      // Adjust for reimbursements if enabled
      let finalAmount = convertedAmount;
      if (includeReimbursements && tx.reimbursementAmount) {
        const reimbursedAmount = CurrencyService.convert(
          tx.reimbursementAmount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
        finalAmount -= reimbursedAmount;
      }

      groups.set(key, (groups.get(key) || 0) + finalAmount);
    });

    // Calculate total for percentage calculations
    const total = Array.from(groups.values()).reduce(
      (sum, value) => sum + value,
      0
    );

    // Convert to chart data array with colors
    const result = Array.from(groups.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length],
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
    
    // Limit the number of items if specified
    if (topItemsLimit > 0 && result.length > topItemsLimit) {
      // Take top N-1 items and group the rest as "Other"
      const topItems = result.slice(0, topItemsLimit - 1);
      const otherItems = result.slice(topItemsLimit - 1);
      
      if (otherItems.length > 0) {
        const otherTotal = otherItems.reduce((sum, item) => sum + item.value, 0);
        const otherPercentage = total > 0 ? (otherTotal / total) * 100 : 0;
        
        topItems.push({
          name: "Other",
          value: otherTotal,
          color: "#9e9e9e", // Gray for "Other"
          percentage: otherPercentage
        });
      }
      
      return topItems;
    }
    
    return result;
  },

  /**
   * Generate time series data for bar/line charts
   */
  generateTimeSeriesData(
    transactions: Transaction[],
    options: {
      period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
      displayCurrency: Currency;
      includeReimbursements?: boolean;
      includeTrend?: boolean;
      includeCategoryBreakdown?: boolean;
      maxTopCategories?: number;
    }
  ): TimeSeriesResult {
    const { 
      period = 'month', 
      displayCurrency, 
      includeReimbursements = true, 
      includeTrend = true,
      includeCategoryBreakdown = true,
      maxTopCategories = 3
    } = options;
    
    if (!transactions || transactions.length === 0) {
      return { 
        data: [],
        trend: 0,
        average: 0,
        topCategories: []
      };
    }
    
    // Map period to grouping granularity
    const periodMapping: Record<string, "day" | "week" | "month" | "year"> = {
      day: "day",
      week: "day",
      month: "week",
      quarter: "month",
      year: "month",
    };
    
    const groupBy = periodMapping[period] || "month";
    
    // Group transactions by date
    const groupedTransactions = this.groupTransactionsByPeriod(
      transactions, 
      groupBy
    );
    
    // Get sorted keys for date ordering
    const sortedKeys = Array.from(groupedTransactions.keys()).sort();
    
    // Process data for each time period
    const processedData = sortedKeys.map((key): ProcessedChartItem => {
      const periodTransactions = groupedTransactions.get(key) || [];
      const keyString = String(key); // Ensure key is treated as string
      
      // Calculate total for the period with reimbursement adjustments
      const total = periodTransactions.reduce((sum, tx) => {
        // Convert to display currency
        const convertedAmount = CurrencyService.convert(
          tx.amount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );

        // Adjust for reimbursements if applicable
        let finalAmount = convertedAmount;
        if (includeReimbursements && tx.reimbursementAmount) {
          const reimbursedAmount = CurrencyService.convert(
            tx.reimbursementAmount,
            tx.currency as Currency,
            displayCurrency,
            tx.paymentMethod
          );
          finalAmount -= reimbursedAmount;
        }

        return sum + finalAmount;
      }, 0);
      
      // Get top categories for this period if requested
      const topCategories = includeCategoryBreakdown
        ? this.getTopCategoriesForPeriod(
            periodTransactions,
            maxTopCategories,
            displayCurrency,
            includeReimbursements
          )
        : [];
      
      // Format time period for display
      let displayPeriod = keyString;
      
      try {
        if (groupBy === "day") {
          // Format day: Oct 15
          const date = new Date(keyString);
          if (!isNaN(date.getTime())) {
            displayPeriod = format(date, 'MMM d');
          }
        } else if (groupBy === "week") {
          // For weeks, show date range: Oct 1-7
          const startDate = new Date(keyString);
          if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            displayPeriod = `${format(startDate, 'MMM d')}-${format(endDate, 'd')}`;
          }
        } else if (groupBy === "month") {
          // For months, show month name: Oct 2023
          const parts = keyString.split("-");
          if (parts.length >= 2) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // 0-based month
            const date = new Date(year, month, 1);
            if (!isNaN(date.getTime())) {
              displayPeriod = format(date, 'MMM yyyy');
            }
          }
        }
      } catch (e) {
        console.error("Error formatting date for chart:", e);
        // Fallback to the original key if date formatting fails
      }
      
      return {
        period: displayPeriod,
        amount: total,
        originalKey: keyString,
        name: displayPeriod, // For consistency with ChartDataItem
        value: total, // For consistency with ChartDataItem
        color: CHART_COLORS[0], // Default color
        topCategories
      };
    });
    
    // Calculate trend (period-over-period change)
    let calculatedTrend = 0;
    if (includeTrend && processedData.length >= 2) {
      const currentAmount = processedData[processedData.length - 1].amount;
      const previousAmount = processedData[processedData.length - 2].amount;
      
      calculatedTrend = metricsUtils.calculatePercentageChange(currentAmount, previousAmount);
    }
    
    // Calculate average
    const calculatedAverage =
      processedData.length > 0
        ? processedData.reduce((sum, item) => sum + item.amount, 0) / processedData.length
        : 0;
    
    // Get top categories across all periods
    const latestKey = sortedKeys.length > 0 ? sortedKeys[sortedKeys.length - 1] : null;
    const latestTransactions = latestKey
      ? groupedTransactions.get(latestKey) || []
      : [];
    
    const topCategories = this.getTopCategoriesForPeriod(
      latestTransactions,
      maxTopCategories,
      displayCurrency,
      includeReimbursements
    );
    
    return {
      data: processedData,
      trend: includeTrend ? calculatedTrend : undefined,
      average: calculatedAverage,
      topCategories
    };
  },
  
  /**
   * Group transactions by time period
   */
  groupTransactionsByPeriod(
    transactions: Transaction[],
    groupBy: "day" | "week" | "month" | "year"
  ): Map<string, Transaction[]> {
    const grouped = new Map<string, Transaction[]>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      let key: string;

      switch (groupBy) {
        case "day":
          key = date.toISOString().split("T")[0]; // YYYY-MM-DD
          break;
        case "week": {
          // Get the start of the week (Sunday)
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          key = startOfWeek.toISOString().split("T")[0];
          break;
        }
        case "month":
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          break;
        case "year":
          key = `${date.getFullYear()}`;
          break;
        default:
          key = date.toISOString().split("T")[0]; // Default to day
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      const group = grouped.get(key);
      if (group) {
        group.push(transaction);
      }
    });

    return grouped;
  },
  
  /**
   * Get top spending categories for a set of transactions
   */
  getTopCategoriesForPeriod(
    transactions: Transaction[],
    maxCategories: number = 3,
    displayCurrency: Currency = "SGD",
    accountForReimbursements: boolean = true
  ): Array<{ category: string; amount: number }> {
    // Group by category
    const categoryMap = new Map<string, number>();

    transactions.forEach((tx) => {
      if (!tx.category) return;

      // Convert to display currency
      const convertedAmount = CurrencyService.convert(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );

      // Adjust for reimbursements if applicable
      let finalAmount = convertedAmount;
      if (accountForReimbursements && tx.reimbursementAmount) {
        const reimbursedAmount = CurrencyService.convert(
          tx.reimbursementAmount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
        finalAmount -= reimbursedAmount;
      }

      const existingAmount = categoryMap.get(tx.category) || 0;
      categoryMap.set(tx.category, existingAmount + finalAmount);
    });

    // Convert to array and sort by amount (descending)
    const categories = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    return categories.slice(0, maxCategories);
  }
};
