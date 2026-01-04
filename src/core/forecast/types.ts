// src/core/forecast/types.ts
import { Currency, Transaction } from "@/types";

/**
 * User spending behavior profile types
 * - front-loader: >50% of spending in first 10 days of month
 * - back-loader: >50% of spending in last 10 days of month
 * - payday-spiker: Large spikes near 1st and 15th of month
 * - steady: Even distribution across the month
 * - variable: No clear pattern detected
 */
export type SpenderProfile =
  | "front-loader"
  | "back-loader"
  | "steady"
  | "payday-spiker"
  | "variable";

/**
 * A fixed/recurring expense detected from transaction patterns
 */
export interface FixedExpense {
  /** Merchant name */
  merchantName: string;
  /** Expected amount (average of historical occurrences) */
  expectedAmount: number;
  /** Expected day of month (1-31) */
  expectedDay: number;
  /** Expense category */
  category: string;
  /** Confidence score 0-1 that this is truly a fixed expense */
  confidence: number;
  /** Date of last occurrence */
  lastOccurrence: string;
  /** Number of historical occurrences detected */
  occurrenceCount: number;
}

/**
 * Forecast for a single day
 */
export interface DailyForecast {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Day of month (1-31) */
  dayOfMonth: number;
  /** Day of week (0=Sunday, 6=Saturday) */
  dayOfWeek: number;
  /** Predicted spending amount for this day */
  forecastAmount: number;
  /** Actual spending amount (if date has passed) */
  actualAmount?: number;
  /** Running total of forecast through this day */
  cumulativeForecast: number;
  /** Running total of actual spending through this day */
  cumulativeActual?: number;
  /** Whether this day falls in a holiday period */
  isHoliday: boolean;
  /** Name of holiday if applicable */
  holidayName?: string;
  /** Fixed expenses expected on this day */
  fixedExpenses: FixedExpense[];
  /** Whether this is a weekend day */
  isWeekend: boolean;
  /** Confidence score 0-1 for this day's forecast */
  confidence: number;
}

/**
 * Spending patterns extracted from historical data
 */
export interface SpendingPattern {
  /** Spending factor for each day of week (0=Sunday to 6=Saturday) */
  dayOfWeekFactors: number[];
  /** Average daily spending on weekends */
  weekendAverage: number;
  /** Average daily spending on weekdays */
  weekdayAverage: number;
  /** Ratio of weekend to weekday spending */
  weekendToWeekdayRatio: number;
  /** Detected holiday multipliers keyed by holiday name */
  holidayMultipliers: Record<string, number>;
  /** Overall daily average spending */
  dailyAverage: number;
}

/**
 * Classification result for expenses
 */
export interface ExpenseClassification {
  /** Detected fixed/recurring expenses */
  fixed: FixedExpense[];
  /** Variable expenses (all other transactions) */
  variable: Transaction[];
  /** Total fixed expense amount expected per month */
  fixedTotal: number;
  /** Average variable spending per month */
  variableAverage: number;
}

/**
 * Result of the forecasting algorithm
 */
export interface ForecastResult {
  /** Daily forecasts for the current month */
  dailyForecasts: DailyForecast[];
  /** Projected total spending for the month */
  monthlyProjection: number;
  /** User's budget (if set) */
  budget: number | null;
  /** Variance between projection and budget (positive = over budget) */
  variance: number | null;
  /** Detected spender profile */
  spenderProfile: SpenderProfile;
  /** Detected fixed expenses */
  fixedExpenses: FixedExpense[];
  /** Average daily variable spending */
  variableAverage: number;
  /** Overall confidence score 0-1 */
  confidence: number;
  /** Whether this is the user's first month (insufficient history) */
  isFirstMonth: boolean;
  /** Currency of the forecast */
  currency: Currency;
  /** Month being forecast (YYYY-MM format) */
  forecastMonth: string;
  /** Spending patterns detected */
  patterns: SpendingPattern;
}

/**
 * Options for generating a forecast
 */
export interface ForecastOptions {
  /** Currency for the forecast */
  currency: Currency;
  /** User's budget amount (optional) */
  budget?: number;
  /** Budget period type */
  budgetPeriod?: "weekly" | "monthly";
  /** Whether to apply holiday multipliers */
  includeHolidays: boolean;
  /** Number of months to look back for patterns (default: 3) */
  historicalMonths: number;
  /** Target month to forecast (default: current month) */
  targetMonth?: Date;
}

/**
 * Holiday configuration
 */
export interface HolidayConfig {
  /** Holiday name */
  name: string;
  /** Month (1-12) */
  month: number;
  /** Start day of high-spending period */
  startDay: number;
  /** End day of high-spending period */
  endDay: number;
  /** Spending multiplier during this period */
  multiplier: number;
  /** Whether this holiday has a dynamic date (e.g., Lunar New Year) */
  isDynamic?: boolean;
}

/**
 * Chart data point for forecast visualization
 */
export interface ForecastChartItem {
  /** Display label (e.g., "Jan 1", "Week 1") */
  period: string;
  /** Original date key */
  originalKey: string;
  /** Actual spending amount */
  amount: number;
  /** Forecast amount */
  forecastAmount: number;
  /** Cumulative actual spending */
  cumulativeAmount: number;
  /** Cumulative forecast */
  cumulativeForecast: number;
  /** Whether this is a projected (future) data point */
  isProjected: boolean;
  /** Variance (actual - forecast) for past days */
  variance?: number;
  /** Budget line value (constant) */
  budgetLine?: number;
}

/**
 * Processed chart data for rendering
 */
export interface ForecastChartData {
  /** All data points */
  data: ForecastChartItem[];
  /** Budget amount for reference line */
  budget: number | null;
  /** Monthly projection */
  projection: number;
  /** Spender profile for display */
  spenderProfile: SpenderProfile;
  /** Confidence score */
  confidence: number;
  /** Whether this is first month data */
  isFirstMonth: boolean;
}

/**
 * Display mode for forecast chart
 */
export type ForecastDisplayMode = "cumulative" | "daily";

/**
 * Intra-month spending distribution
 */
export interface IntraMonthDistribution {
  /** Spending in first third of month (days 1-10) */
  firstThird: number;
  /** Spending in middle third of month (days 11-20) */
  middleThird: number;
  /** Spending in last third of month (days 21-31) */
  lastThird: number;
  /** Total spending */
  total: number;
}

/**
 * Cache entry for forecast results
 */
export interface ForecastCacheEntry {
  /** Cached result */
  result: ForecastResult;
  /** Timestamp when cached */
  timestamp: number;
  /** Cache key */
  key: string;
}
