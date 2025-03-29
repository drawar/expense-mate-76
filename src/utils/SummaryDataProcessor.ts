// src/utils/SummaryDataProcessor.ts
import { Transaction, PaymentMethod, Currency } from '@/types';
import { convertCurrency } from './currencyConversion';
import { getCategoryFromMCC, getCategoryFromMerchantName } from './categoryMapping';

// Color palette for charts
export const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6366F1', // indigo
  '#EF4444', // red
  '#14B8A6', // teal
  '#F97316', // orange
];

// Base currency for consistent ranking calculations
export const BASE_CURRENCY: Currency = 'SGD';

/**
 * Type defining the structure of chart data
 */
export interface ChartDataItem {
  name: string;
  value: number;
  color: string;
}

/**
 * Type defining the structure of summary data
 */
export interface SummaryData {
  // Basic metrics
  totalExpenses: number;
  transactionCount: number;
  averageAmount: number;
  
  // Payment method metrics
  topPaymentMethod: {
    name: string;
    value: number;
  } | undefined;
  
  // Reward points metrics
  totalRewardPoints: number;
  
  // Chart data
  paymentMethodChartData: ChartDataItem[];
  categoryChartData: ChartDataItem[];
  
  // Trend metrics
  percentageChange: number;
}

/**
 * Type for date range filters
 */
export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Filter criteria for backward compatibility
 */
export interface FilterCriteria {
  dateRange?: DateRange;
  [key: string]: any;
}

/**
 * Enhanced class responsible for processing transaction data to generate summary data
 * with consistent results regardless of display currency
 */
export class SummaryDataProcessor {
  private transactions: Transaction[];
  private previousPeriodTransactions: Transaction[] = [];
  private displayCurrency: Currency;
  
  /**
   * Initialize the processor with transactions and currency
   */
  constructor(
    transactions: Transaction[], 
    displayCurrency: Currency = 'SGD',
    previousPeriodTransactions: Transaction[] = []
  ) {
    this.transactions = this.processTransactionCategories(transactions);
    this.previousPeriodTransactions = this.processTransactionCategories(previousPeriodTransactions);
    this.displayCurrency = displayCurrency;
  }
  
  /**
   * Process transactions to ensure all have categories
   */
  private processTransactionCategories(transactions: Transaction[]): Transaction[] {
    return transactions.map(tx => {
      // Skip processing if category is already set and not Uncategorized
      if (tx.category && tx.category !== 'Uncategorized') {
        return tx;
      }
      
      // Determine category from MCC code or merchant name
      let category = 'Uncategorized';
      if (tx.merchant?.mcc?.code) {
        category = getCategoryFromMCC(tx.merchant.mcc.code);
      } else if (tx.merchant?.name) {
        category = getCategoryFromMerchantName(tx.merchant.name) || 'Uncategorized';
      }
      
      return {...tx, category};
    });
  }

  /**
   * Backward compatibility method for filtering transactions
   * Supports previous API that used generic filter criteria
   */
  public filterTransactions(criteria?: FilterCriteria): Transaction[] {
    // Log deprecation warning in development environment
    if (process.env.NODE_ENV !== 'production') {
      console.warn('SummaryDataProcessor.filterTransactions is deprecated, use filterTransactionsByDateRange instead');
    }
    
    // Return all transactions if no criteria
    if (!criteria) {
      return this.transactions;
    }
    
    // Support date range filtering for backward compatibility
    if (criteria.dateRange) {
      return this.filterTransactionsByDateRange(criteria.dateRange);
    }
    
    // Fall back to returning all transactions
    return this.transactions;
  }

  /**
   * Filter transactions based on date range
   */
  public filterTransactionsByDateRange(dateRange: DateRange): Transaction[] {
    return this.transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= dateRange.start && txDate <= dateRange.end;
    });
  }
  
  /**
   * Generate date ranges based on current date
   */
  public static generateDateRanges(useStatementMonth: boolean = false, statementCycleDay: number = 1): Record<string, DateRange | Date | null> {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Calculate all possible date ranges upfront
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthEnd = new Date(currentYear, currentMonth, 0);
    
    const threeMonthsAgo = new Date(currentYear, currentMonth - 3, now.getDate());
    
    const thisYearStart = new Date(currentYear, 0, 1);
    const thisYearEnd = new Date(currentYear, 11, 31);
    
    // Statement date range if enabled
    let statementStart, statementEnd;
    
    if (useStatementMonth) {
      // Start date: statementCycleDay of previous month
      let startMonth = currentMonth - 1;
      let startYear = currentYear;
      if (startMonth < 0) {
        startMonth = 11; // December
        startYear -= 1;
      }
      
      statementStart = new Date(startYear, startMonth, statementCycleDay);
      
      // End date: day before statementCycleDay of current month
      statementEnd = new Date(currentYear, currentMonth, statementCycleDay - 1);
      // If statementCycleDay is 1, set to end of previous month
      if (statementCycleDay === 1) {
        statementEnd.setDate(0); // Last day of previous month
      }
      
      // Ensure end date is not in the future
      if (statementEnd > now) {
        statementEnd = now;
      }
    }
    
    return {
      thisMonth: { start: thisMonthStart, end: thisMonthEnd },
      lastMonth: { start: lastMonthStart, end: lastMonthEnd },
      threeMonthsAgo,
      thisYear: { start: thisYearStart, end: thisYearEnd },
      statement: useStatementMonth ? { start: statementStart, end: statementEnd } : null
    };
  }
  
  /**
   * Calculate total expenses from a list of transactions with currency conversion
   */
  public calculateTotalExpenses(transactions: Transaction[]): number {
    return transactions.reduce((total, tx) => {
      try {
        const txCurrency = tx.currency as Currency;
        const convertedAmount = convertCurrency(
          tx.amount,
          txCurrency,
          this.displayCurrency,
          tx.paymentMethod
        );
        return total + convertedAmount;
      } catch (error) {
        console.error('Error converting currency for transaction:', tx.id, error);
        return total;
      }
    }, 0);
  }
  
  /**
   * Calculate average transaction amount
   */
  public calculateAverageAmount(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;
    return this.calculateTotalExpenses(transactions) / transactions.length;
  }

  /**
   * Calculate percentage change between current and previous period
   */
  public calculatePercentageChange(currentValue: number, previousValue: number): number {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Calculate total reward points from transactions
   */
  public calculateTotalRewardPoints(transactions: Transaction[]): number {
    return transactions.reduce((total, transaction) => {
      const points = typeof transaction.rewardPoints === 'number' 
        ? transaction.rewardPoints 
        : 0;
      return total + points;
    }, 0);
  }
  
  /**
   * Generate payment method chart data with consistent ranking
   * Modified to ensure payment method ranking is consistent regardless of display currency
   */
  public generatePaymentMethodChartData(transactions: Transaction[]): ChartDataItem[] {
    // No need to process if there are no transactions
    if (transactions.length === 0) return [];
    
    // Group expenses by payment method using a consistent base currency (SGD)
    const expensesByPaymentMethod = new Map<string, number>();
    
    // Process all transactions - First pass: calculate totals in base currency
    transactions.forEach(tx => {
      try {
        const methodName = tx.paymentMethod?.name || 'Unknown';
        const txCurrency = tx.currency as Currency;
        
        // First convert amount to base currency (SGD) for consistent ranking
        const baseAmount = convertCurrency(
          tx.amount,
          txCurrency,
          BASE_CURRENCY,
          tx.paymentMethod
        );
        
        // Add to the payment method total in base currency
        const currentTotal = expensesByPaymentMethod.get(methodName) || 0;
        expensesByPaymentMethod.set(methodName, currentTotal + baseAmount);
      } catch (error) {
        console.error('Error processing payment method data:', error);
      }
    });
    
    // Convert the map to an array of entries for sorting
    const methodEntries = Array.from(expensesByPaymentMethod.entries())
      .sort((a, b) => b[1] - a[1]); // Sort by amount in base currency (descending)
    
    // Now convert the base currency amounts to display currency for presentation
    return methodEntries.map(([name, baseValue], index) => {
      // Convert from base currency to display currency for display
      const displayValue = BASE_CURRENCY === this.displayCurrency 
        ? baseValue 
        : convertCurrency(baseValue, BASE_CURRENCY, this.displayCurrency);
        
      return {
        name,
        value: displayValue,
        color: CHART_COLORS[index % CHART_COLORS.length]
      };
    });
  }
  
  /**
   * Find the top payment method by total spending
   * Ensures consistent ranking across different display currencies
   */
  public findTopPaymentMethod(transactions: Transaction[]): { name: string; value: number } | undefined {
    // Generate chart data with consistent ranking
    const chartData = this.generatePaymentMethodChartData(transactions);
    
    // Return the top payment method (first entry after sorting)
    return chartData.length > 0 
      ? { name: chartData[0].name, value: chartData[0].value } 
      : undefined;
  }

  /**
   * Generate category chart data with consistent ranking
   */
  public generateCategoryChartData(transactions: Transaction[]): ChartDataItem[] {
    // No need to process if there are no transactions
    if (transactions.length === 0) return [];
    
    // Group expenses by category using base currency for consistency
    const expensesByCategory = new Map<string, number>();
    
    // Process all transactions
    transactions.forEach(tx => {
      try {
        const category = tx.category || 'Uncategorized';
        const txCurrency = tx.currency as Currency;
        
        // Convert amount to base currency for consistent ranking
        const baseAmount = convertCurrency(
          tx.amount,
          txCurrency,
          BASE_CURRENCY,
          tx.paymentMethod
        );
        
        // Add to the category total
        const currentTotal = expensesByCategory.get(category) || 0;
        expensesByCategory.set(category, currentTotal + baseAmount);
      } catch (error) {
        console.error('Error processing category data:', error);
      }
    });
    
    // Sort by base currency amounts
    const categoryEntries = Array.from(expensesByCategory.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // Convert to display currency for presentation
    return categoryEntries.map(([name, baseValue], index) => {
      // Convert from base currency to display currency
      const displayValue = BASE_CURRENCY === this.displayCurrency 
        ? baseValue 
        : convertCurrency(baseValue, BASE_CURRENCY, this.displayCurrency);
        
      return {
        name,
        value: displayValue,
        color: CHART_COLORS[index % CHART_COLORS.length]
      };
    });
  }
  
  /**
   * Generate complete summary data for a period
   * With consistent rankings across different display currencies
   */
  public getSummaryData(transactions: Transaction[] = this.transactions): SummaryData {
    // Skip calculations if no transactions to process
    if (transactions.length === 0) {
      return {
        totalExpenses: 0,
        totalRewardPoints: 0,
        transactionCount: 0,
        averageAmount: 0,
        paymentMethodChartData: [],
        categoryChartData: [],
        topPaymentMethod: undefined,
        percentageChange: 0
      };
    }
    
    // Calculate metrics
    const totalExpenses = this.calculateTotalExpenses(transactions);
    const transactionCount = transactions.length;
    const averageAmount = this.calculateAverageAmount(transactions);
    const totalRewardPoints = this.calculateTotalRewardPoints(transactions);
    const paymentMethodChartData = this.generatePaymentMethodChartData(transactions);
    const categoryChartData = this.generateCategoryChartData(transactions);
    const topPaymentMethod = this.findTopPaymentMethod(transactions);
    
    // Calculate percentage change compared to previous period
    const previousTotalExpenses = this.calculateTotalExpenses(this.previousPeriodTransactions);
    const percentageChange = this.calculatePercentageChange(totalExpenses, previousTotalExpenses);
    
    return {
      totalExpenses,
      transactionCount,
      averageAmount,
      topPaymentMethod,
      totalRewardPoints,
      paymentMethodChartData,
      categoryChartData,
      percentageChange
    };
  }
}