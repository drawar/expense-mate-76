// src/utils/chartDataProcessor.ts
import { Transaction, Currency } from "@/types";
import { CurrencyService } from "@/services/CurrencyService";
import { CHART_COLORS } from "@/utils/dashboardCalculations";
import {
  calculatePercentageChange,
  ChartDataItem,
} from "@/utils/dashboardUtils";

/**
 * Processed data for bar chart items with additional metadata
 */
export interface ProcessedChartItem extends ChartDataItem {
  /** Period label (e.g., "Jan", "Q1", "Week 1") */
  period: string;
  /** Original date/time key before formatting */
  originalKey: string;
  /** Top spending categories for this period */
  topCategories?: Array<{ category: string; amount: number }>;
}

/**
 * Result of chart data processing with trend analysis
 */
export interface ChartProcessingResult {
  /** Formatted data ready for chart rendering */
  chartData: ProcessedChartItem[];
  /** Percentage change compared to previous period */
  trend: number;
  /** Average value across all periods */
  average: number;
  /** Top categories across all periods */
  topCategories: Array<{ category: string; amount: number }>;
}

/**
 * Options for chart data processing
 */
export interface ChartProcessingOptions {
  /** Time period grouping ('day', 'week', 'month', 'year') */
  period?: "day" | "week" | "month" | "quarter";
  /** Whether to include category breakdown for tooltip display */
  includeCategoryBreakdown?: boolean;
  /** Maximum number of top categories to include */
  maxTopCategories?: number;
  /** Whether to calculate trend percentage */
  includeTrend?: boolean;
  /** Currency for display and conversion */
  displayCurrency?: Currency;
  /** Whether to account for reimbursements in calculations */
  accountForReimbursements?: boolean;
}

/**
 * Process transaction data into pie chart format
 *
 * @param transactions - Transactions to process
 * @param groupByField - Field to group by (paymentMethod, category, etc.)
 * @param displayCurrency - Currency to convert values to
 * @param colorPalette - Color scheme to use
 * @param accountForReimbursements - Whether to subtract reimbursed amounts
 * @returns Array of formatted chart data items
 */
export function processPieChartData(
  transactions: Transaction[],
  groupByField: "paymentMethod" | "category" | string,
  displayCurrency: Currency,
  colorPalette: string[] = CHART_COLORS,
  accountForReimbursements: boolean = true
): ChartDataItem[] {
  if (!transactions || transactions.length === 0) return [];

  // Group transactions by the specified field
  const groups = new Map<string, number>();

  transactions.forEach((tx) => {
    let key = "Uncategorized";

    if (groupByField === "paymentMethod") {
      key = tx.paymentMethod?.name || "Unknown";
    } else if (groupByField === "category") {
      key = tx.category || "Uncategorized";
    } else if (tx[groupByField as keyof Transaction]) {
      // Handle other potential grouping fields
      key = String(tx[groupByField as keyof Transaction]);
    }

    // Convert amount to display currency
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
        tx.currency as Currency, // Reimbursement is in same currency as transaction
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
  return Array.from(groups.entries())
    .map(([name, value], index) => ({
      name,
      value,
      color: colorPalette[index % colorPalette.length],
      percentage: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending
}

/**
 * Groups transactions by time period (day, week, month, year)
 *
 * @param transactions - Transactions to group
 * @param groupBy - Time period to group by
 * @returns Map of date keys to transaction arrays
 */
export function groupTransactionsByPeriod(
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

    grouped.get(key)?.push(transaction);
  });

  return grouped;
}

/**
 * Get top spending categories for a set of transactions
 *
 * @param transactions - Transactions to analyze
 * @param maxCategories - Maximum number of categories to return
 * @param displayCurrency - Currency to convert amounts to
 * @param accountForReimbursements - Whether to subtract reimbursed amounts
 * @returns Array of category and amount pairs
 */
export function getTopCategoriesForPeriod(
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

/**
 * Process transactions for time-based chart visualization
 *
 * @param transactions - Transactions to process
 * @param options - Processing options
 * @returns Processed chart data with trends and insights
 */
export function processTransactionsForChart(
  transactions: Transaction[],
  options: ChartProcessingOptions = {}
): ChartProcessingResult {
  const {
    period = "month",
    includeCategoryBreakdown = true,
    maxTopCategories = 3,
    includeTrend = true,
    displayCurrency = "SGD",
    accountForReimbursements = true,
  } = options;

  if (transactions.length === 0) {
    return {
      chartData: [],
      trend: 0,
      average: 0,
      topCategories: [],
    };
  }

  // Determine the grouping period based on selected time frame
  const periodMapping: Record<string, "day" | "week" | "month" | "year"> = {
    week: "day",
    month: "week",
    quarter: "month",
    year: "month",
  };

  // Group transactions by date
  const groupedTransactions = groupTransactionsByPeriod(
    transactions,
    periodMapping[period] || "month"
  );

  // Get top categories for the most recent period
  const sortedKeys = Array.from(groupedTransactions.keys()).sort();
  const latestKey = sortedKeys[sortedKeys.length - 1];
  const latestTransactions = latestKey
    ? groupedTransactions.get(latestKey) || []
    : [];

  // Get top categories
  const topCats = getTopCategoriesForPeriod(
    latestTransactions,
    maxTopCategories,
    displayCurrency,
    accountForReimbursements
  );

  // Format keys for display
  const processedChartData = sortedKeys.map((key) => {
    const periodTransactions = groupedTransactions.get(key) || [];

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
      if (accountForReimbursements && tx.reimbursementAmount) {
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
    const periodTopCategories = includeCategoryBreakdown
      ? getTopCategoriesForPeriod(
          periodTransactions,
          maxTopCategories,
          displayCurrency,
          accountForReimbursements
        )
      : [];

    // Format the key for display
    let displayDate = key;
    if (periodMapping[period] === "week") {
      // For weeks, show date range
      const startDate = new Date(key);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      displayDate = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
    } else if (periodMapping[period] === "month") {
      // For months, show month name
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      displayDate = date.toLocaleString("default", { month: "short" });
      if (period === "quarter") {
        displayDate += ` ${year}`;
      }
    }

    return {
      period: displayDate,
      amount: total,
      originalKey: key,
      name: displayDate, // For consistency with ChartDataItem
      value: total, // For consistency with ChartDataItem
      color: "#8884d8", // Default color
      topCategories: periodTopCategories,
    };
  });

  // Calculate trend (period-over-period change)
  let calculatedTrend = 0;
  if (includeTrend && processedChartData.length >= 2) {
    const currentAmount =
      processedChartData[processedChartData.length - 1].amount;
    const previousAmount =
      processedChartData[processedChartData.length - 2].amount;
    calculatedTrend = calculatePercentageChange(currentAmount, previousAmount);
  }

  // Calculate average
  const calculatedAverage =
    processedChartData.length > 0
      ? processedChartData.reduce((sum, item) => sum + item.amount, 0) /
        processedChartData.length
      : 0;

  return {
    chartData: processedChartData,
    trend: calculatedTrend,
    average: calculatedAverage,
    topCategories: topCats,
  };
}
