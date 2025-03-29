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
 * Type for tab options available in the UI
 */
export type TimeframeTab = 'thisMonth' | 'lastMonth' | 'lastThreeMonths' | 'thisYear';

/**
 * Class responsible for processing transaction data to generate summary data
 * for the dashboard. Implements OOP principles by encapsulating data processing
 * logic in a reusable class.
 */
export class SummaryDataProcessor {
  // Private fields for better encapsulation
  private readonly transactions: Transaction[];
  private readonly previousPeriodTransactions: Transaction[];
  private readonly displayCurrency: Currency;
  private filteredTransactions: Transaction[] = [];
  
  /**
   * Initialize the processor with transactions and currency
   */
  constructor(
    transactions: Transaction[], 
    displayCurrency: Currency = 'SGD',
    previousPeriodTransactions: Transaction[] = []
  ) {
    // Process categories for all transactions upfront for better performance
    this.transactions = this.processTransactionCategories(transactions);
    this.previousPeriodTransactions = this.processTransactionCategories(previousPeriodTransactions);
    this.displayCurrency = displayCurrency;
  }
  
  /**
   * Process transactions to ensure all have categories
   * @private
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
   * Filter transactions based on timeframe tab and statement settings
   * @public
   */
  public filterTransactions(
    activeTab: TimeframeTab, 
    useStatementMonth: boolean = false, 
    statementCycleDay: number = 1
  ): SummaryDataProcessor {
    const dateRanges = SummaryDataProcessor.generateDateRanges(useStatementMonth, statementCycleDay);
    
    // If statement cycle is enabled, apply statement cycle filter regardless of tab
    if (useStatementMonth && dateRanges.statement) {
      this.filteredTransactions = this.transactions.filter(tx => {
        const txDate = new Date(tx.date);
        const range = dateRanges.statement as DateRange;
        return txDate >= range.start && txDate <= range.end;
      });
      return this;
    }
    
    // Regular tab-based filtering
    switch (activeTab) {
      case 'thisMonth': {
        const range = dateRanges.thisMonth as DateRange;
        this.filteredTransactions = this.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= range.start && txDate <= range.end;
        });
        break;
      }
      case 'lastMonth': {
        const range = dateRanges.lastMonth as DateRange;
        this.filteredTransactions = this.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= range.start && txDate <= range.end;
        });
        break;
      }
      case 'lastThreeMonths': {
        const threeMonthsAgo = dateRanges.threeMonthsAgo as Date;
        this.filteredTransactions = this.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= threeMonthsAgo;
        });
        break;
      }
      case 'thisYear': {
        const range = dateRanges.thisYear as DateRange;
        this.filteredTransactions = this.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= range.start && txDate <= range.end;
        });
        break;
      }
      default:
        this.filteredTransactions = this.transactions;
    }
    
    return this;
  }
  
  /**
   * Generate date ranges based on current date
   * @static
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
   * Get the filtered transactions
   * @public
   */
  public getFilteredTransactions(): Transaction[] {
    return this.filteredTransactions.length > 0 ? this.filteredTransactions : this.transactions;
  }
  
  /**
   * Calculate total expenses from a list of transactions with currency conversion
   * @public
   */
  public calculateTotalExpenses(): number {
    const transactions = this.getFilteredTransactions();
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
   * @public
   */
  public calculateAverageAmount(): number {
    const transactions = this.getFilteredTransactions();
    if (transactions.length === 0) return 0;
    return this.calculateTotalExpenses() / transactions.length;
  }

  /**
   * Calculate percentage change between current and previous period
   * @public
   */
  public calculatePercentageChange(): number {
    const currentValue = this.calculateTotalExpenses();
    const previousValue = this.previousPeriodTransactions.reduce((total, tx) => {
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
        console.error('Error converting currency for previous transaction:', tx.id, error);
        return total;
      }
    }, 0);
    
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Calculate total reward points from transactions
   * @public
   */
  public calculateTotalRewardPoints(): number {
    const transactions = this.getFilteredTransactions();
    return transactions.reduce((total, transaction) => {
      const points = typeof transaction.rewardPoints === 'number' 
        ? transaction.rewardPoints 
        : 0;
      return total + points;
    }, 0);
  }
  
  /**
   * Generate payment method chart data
   * @public
   */
  public generatePaymentMethodChartData(): ChartDataItem[] {
    const transactions = this.getFilteredTransactions();
    
    // No need to process if there are no transactions
    if (transactions.length === 0) return [];
    
    // Group expenses by payment method
    const expensesByPaymentMethod = new Map<string, number>();
    
    // Process all transactions
    transactions.forEach(tx => {
      try {
        const methodName = tx.paymentMethod?.name || 'Unknown';
        const txCurrency = tx.currency as Currency;
        
        // Convert amount to display currency
        const convertedAmount = convertCurrency(
          tx.amount,
          txCurrency,
          this.displayCurrency,
          tx.paymentMethod
        );
        
        // Add to the payment method total
        const currentTotal = expensesByPaymentMethod.get(methodName) || 0;
        expensesByPaymentMethod.set(methodName, currentTotal + convertedAmount);
      } catch (error) {
        console.error('Error processing payment method data:', error);
      }
    });
    
    // Convert to chart data array with colors
    return Array.from(expensesByPaymentMethod.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }
  
  /**
   * Find the top payment method by total spending
   * @public
   */
  public findTopPaymentMethod(): { name: string; value: number } | undefined {
    const chartData = this.generatePaymentMethodChartData();
    return chartData.length > 0 
      ? { name: chartData[0].name, value: chartData[0].value } 
      : undefined;
  }

  /**
   * Generate category chart data
   * @public
   */
  public generateCategoryChartData(): ChartDataItem[] {
    const transactions = this.getFilteredTransactions();
    
    // No need to process if there are no transactions
    if (transactions.length === 0) return [];
    
    // Group expenses by category
    const expensesByCategory = new Map<string, number>();
    
    // Process all transactions
    transactions.forEach(tx => {
      try {
        const category = tx.category || 'Uncategorized';
        const txCurrency = tx.currency as Currency;
        
        // Convert amount to display currency
        const convertedAmount = convertCurrency(
          tx.amount,
          txCurrency,
          this.displayCurrency,
          tx.paymentMethod
        );
        
        // Add to the category total
        const currentTotal = expensesByCategory.get(category) || 0;
        expensesByCategory.set(category, currentTotal + convertedAmount);
      } catch (error) {
        console.error('Error processing category data:', error);
      }
    });
    
    // Convert to chart data array with colors
    return Array.from(expensesByCategory.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }
  
  /**
   * Generate complete summary data
   * @public
   */
  public getSummaryData(): SummaryData {
    const transactions = this.getFilteredTransactions();
    
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
    const totalExpenses = this.calculateTotalExpenses();
    const transactionCount = transactions.length;
    const averageAmount = this.calculateAverageAmount();
    const totalRewardPoints = this.calculateTotalRewardPoints();
    const paymentMethodChartData = this.generatePaymentMethodChartData();
    const categoryChartData = this.generateCategoryChartData();
    const topPaymentMethod = this.findTopPaymentMethod();
    const percentageChange = this.calculatePercentageChange();
    
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
