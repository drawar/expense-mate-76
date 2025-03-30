// src/types/dashboardTypes.ts
import { Transaction, Currency } from '@/types';
import { ChartProcessingResult } from '@/utils/chartDataProcessor';
import { ChartDataItem } from '@/utils/dashboardUtils';

/**
 * Dashboard metrics interface - contains all numerical indicators
 */
export interface DashboardMetrics {
  /** Total expenses in display currency */
  totalExpenses: number;
  
  /** Number of transactions in the period */
  transactionCount: number;
  
  /** Average transaction amount */
  averageAmount: number;
  
  /** Total reward points earned in the period */
  totalRewardPoints: number;
  
  /** Percentage change compared to previous period */
  percentageChange: number;
  
  /** Whether there's enough data for meaningful trends */
  hasEnoughData: boolean;
  
  /** Optional transaction velocity (transactions per day) */
  transactionVelocity?: number;
}

/**
 * Top values interface - contains dominant items for summary cards
 */
export interface TopValues {
  /** Most used payment method with amount */
  paymentMethod?: { name: string; value: number };
  
  /** Most frequent spending category with amount */
  category?: { name: string; value: number };
}

/**
 * Chart data interface - contains all visualization data
 */
export interface ChartData {
  /** Payment method distribution chart data */
  paymentMethods: ChartDataItem[];
  
  /** Category distribution chart data */
  categories: ChartDataItem[];
  
  /** Optional day of week spending average */
  dayOfWeekSpending?: Record<string, number>;
  
  /** Spending trends over time with insights */
  spendingTrends: ChartProcessingResult;
}

/**
 * Dashboard data interface - the complete structure returned by useDashboard
 */
export interface DashboardData {
  /** Raw transaction data filtered by timeframe */
  filteredTransactions: Transaction[];
  
  /** All calculated numerical metrics */
  metrics: DashboardMetrics;
  
  /** Top values for summary display */
  top: TopValues;
  
  /** All chart data for visualizations */
  charts: ChartData;
}

/**
 * Options for the useDashboard hook
 */
export interface DashboardOptions {
  /** Transactions to analyze */
  transactions: Transaction[];
  
  /** Currency to display values in */
  displayCurrency?: Currency;
  
  /** Time period to analyze */
  timeframe?: 'thisMonth' | 'lastMonth' | 'lastThreeMonths' | 'thisYear';
  
  /** Whether to use statement month instead of calendar month */
  useStatementMonth?: boolean;
  
  /** Statement cycle start day (1-31) */
  statementCycleDay?: number;
  
  /** Optional previous period transactions for comparison */
  previousPeriodTransactions?: Transaction[];
  
  /** Whether to calculate day of week metrics */
  calculateDayOfWeekMetrics?: boolean;
  
  /** Whether to calculate transaction velocity */
  calculateVelocity?: boolean;
}

/**
 * Legacy compatibility interface, matching the original SummaryData
 * @deprecated Use DashboardData instead
 */
export interface SummaryData {
  totalExpenses: number;
  transactionCount: number;
  averageAmount: number;
  topPaymentMethod: { name: string; value: number } | undefined;
  totalRewardPoints: number;
  paymentMethodChartData: ChartDataItem[];
  categoryChartData: ChartDataItem[];
  percentageChange: number;
  transactions: Transaction[];
}
