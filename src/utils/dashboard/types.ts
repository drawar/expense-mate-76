// utils/dashboard/types.ts
import { Currency } from "@/types";

/**
 * Valid timeframes for dashboard filtering
 */
export type TimeframeTab =
  | "thisMonth"
  | "lastMonth" // Temporarily disabled in UI
  | "lastTwoMonths"
  | "lastThreeMonths"
  | "lastSixMonths"
  | "thisYear";

/**
 * Options for chart data processing
 */
export interface ChartProcessingOptions {
  groupBy?: "category" | "paymentMethod" | "day" | "week" | "month";
  period?: "day" | "week" | "month" | "quarter" | "year";
  displayCurrency: Currency;
  includeReimbursements?: boolean;
  includeTrend?: boolean;
  includeCategoryBreakdown?: boolean;
  maxTopCategories?: number;
  topItemsLimit?: number;
}

/**
 * Processed data item for bar chart items with additional metadata
 */
export interface ProcessedChartItem {
  /** Period label (e.g., "Jan", "Q1", "Week 1") */
  period: string;
  /** Amount for the period */
  amount: number;
  /** Original date/time key before formatting */
  originalKey: string;
  /** Item name (normally same as period) */
  name: string;
  /** Item value (normally same as amount) */
  value: number;
  /** Bar/data point color */
  color: string;
  /** Top spending categories for this period */
  topCategories?: Array<{ category: string; amount: number }>;
}

/**
 * Result of chart data processing with trend analysis
 */
export interface TimeSeriesResult {
  /** Formatted data ready for chart rendering */
  data: ProcessedChartItem[];
  /** Percentage change compared to previous period */
  trend?: number;
  /** Average value across all periods */
  average?: number;
  /** Top categories across all periods */
  topCategories?: Array<{ category: string; amount: number }>;
}
