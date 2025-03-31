
// src/types/dashboardTypes.ts
import { Transaction, Currency } from '@/types';
import { TimeframeTab } from '@/utils/transactionProcessor';

/**
 * Options for configuring dashboard data processing
 */
export interface DashboardOptions {
  /**
   * Array of transactions to analyze
   */
  transactions: Transaction[];
  
  /**
   * Currency to display monetary values in
   */
  displayCurrency: Currency;
  
  /**
   * Selected time period for filtering transactions
   */
  timeframe: TimeframeTab;
  
  /**
   * Whether to use statement month filtering (for credit cards)
   */
  useStatementMonth?: boolean;
  
  /**
   * Day of month when statement cycle begins
   */
  statementCycleDay?: number;
  
  /**
   * Optional array of transactions from a previous period for comparison
   */
  previousPeriodTransactions?: Transaction[];
  
  /**
   * Whether to calculate day of week metrics (more expensive)
   */
  calculateDayOfWeekMetrics?: boolean;
  
  /**
   * Whether to calculate transaction velocity (transactions per day)
   */
  calculateVelocity?: boolean;
  
  /**
   * Timestamp to force refresh calculations when data is updated
   */
  lastUpdate?: number;
}

/**
 * Structure of processed dashboard data ready for display
 */
export interface DashboardData {
  filteredTransactions: Transaction[];
  metrics: DashboardMetrics;
  top: {
    paymentMethod?: { name: string; value: number };
    category?: { name: string; value: number };
  };
  charts: {
    paymentMethods: ChartItem[];
    categories: ChartItem[];
    dayOfWeekSpending?: Record<string, number>;
    spendingTrends: any;
  };
}

/**
 * Dashboard metrics calculated from transactions
 */
export interface DashboardMetrics {
  totalExpenses: number;
  transactionCount: number;
  averageAmount: number;
  totalRewardPoints: number;
  percentageChange: number;
  hasEnoughData: boolean;
  transactionVelocity?: number;
}

/**
 * Generic chart data item
 */
export interface ChartItem {
  name: string;
  value: number;
  color: string;
}

/**
 * Options for spending trend chart data generation
 */
export interface SpendingTrendOptions {
  includeCategoryBreakdown?: boolean;
  displayCurrency: Currency;
}

