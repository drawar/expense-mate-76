// src/types/dashboard.ts
import { Transaction, Currency } from "@/types";
import { TimeframeTab } from "@/utils/dashboard/index";

/**
 * Chart data structure
 */
export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  highlighted?: boolean;
  percentage?: number;
}

/**
 * Dashboard metrics
 */
export interface DashboardMetrics {
  totalExpenses: number;
  transactionCount: number;
  averageAmount: number;
  totalRewardPoints: number;
  percentageChange: number;
  transactionVelocity?: number;
  hasEnoughData?: boolean;
  totalReimbursed?: number;
  netExpenses?: number;
  // Income metrics
  totalIncome?: number; // Scaled income for timeframe
  netFlow?: number; // totalIncome - netExpenses
}

/**
 * Chart data structure
 */
export interface DashboardChartData {
  paymentMethods: ChartDataItem[];
  categories: ChartDataItem[];
  dayOfWeekSpending?: Record<string, number>;
  spendingTrends: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string;
    }[];
  };
}

/**
 * Top values structure
 */
export interface DashboardTopValues {
  paymentMethod?: { name: string; value: number };
  category?: { name: string; value: number };
}

/**
 * Complete dashboard data structure
 */
export interface DashboardData {
  filteredTransactions: Transaction[];
  metrics: DashboardMetrics;
  top: DashboardTopValues;
  charts: DashboardChartData;
}

/**
 * Options for dashboard data processing
 */
export interface DashboardOptions {
  transactions: Transaction[];
  displayCurrency: Currency;
  timeframe: TimeframeTab;
  useStatementMonth: boolean;
  statementCycleDay: number;
  previousPeriodTransactions?: Transaction[];
  calculateDayOfWeekMetrics?: boolean;
  calculateVelocity?: boolean;
  lastUpdate?: number;
}

/**
 * Dashboard configuration interface
 */
export interface DashboardConfig {
  defaultCurrency: Currency;
  defaultTimeframe: TimeframeTab;
  defaultStatementDay: number;
  defaultUseStatementMonth: boolean;
}
