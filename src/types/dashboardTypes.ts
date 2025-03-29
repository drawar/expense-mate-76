// src/types/dashboardTypes.ts
import { Transaction, Currency } from '@/types';
import { ChartDataItem } from '@/utils/dashboardCalculations';

/**
 * Dashboard data interface - the complete structure returned by useDashboard
 */
export interface DashboardData {
  // Raw transaction data
  filteredTransactions: Transaction[];
  
  // Basic metrics
  metrics: {
    totalExpenses: number;
    transactionCount: number;
    averageAmount: number;
    totalRewardPoints: number;
    percentageChange: number;
    transactionVelocity?: number; // Optional new metric
  };
  
  // Top values
  top: {
    paymentMethod?: { name: string; value: number };
    category?: { name: string; value: number };
  };
  
  // Chart data
  charts: {
    paymentMethods: ChartDataItem[];
    categories: ChartDataItem[];
    // New charts can be added here
    dayOfWeekSpending?: Record<string, number>;
  };
}

/**
 * Options for the useDashboard hook
 */
export interface DashboardOptions {
  // Required data
  transactions: Transaction[];
  
  // Display and filtering options
  displayCurrency?: Currency;
  timeframe?: 'thisMonth' | 'lastMonth' | 'lastThreeMonths' | 'thisYear';
  useStatementMonth?: boolean;
  statementCycleDay?: number;
  
  // Optional comparison data
  previousPeriodTransactions?: Transaction[];
  
  // Feature flags for optional calculations
  calculateDayOfWeekMetrics?: boolean;
  calculateVelocity?: boolean;
}

/**
 * Legacy compatibility interface, matching the original SummaryData
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
