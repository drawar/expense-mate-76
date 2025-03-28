// src/utils/SummaryDataProcessor.ts
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';

/**
 * Type defining the structure of summary data
 */
export interface SummaryData {
  totalExpenses: number;
  transactionCount: number;
  averageAmount: number;
  topPaymentMethod: {
    name: string;
    value: number;
  };
  totalRewardPoints: number;
  paymentMethodChartData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  categoryChartData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

/**
 * Class responsible for processing transaction data to generate summary data
 * for the dashboard. Implements OOP principles by encapsulating data processing
 * logic in a reusable class.
 */
export class SummaryDataProcessor {
  private transactions: Transaction[];
  private currency: string;
  
  /**
   * Initialize the processor with transactions and currency
   */
  constructor(transactions: Transaction[], currency: string = 'SGD') {
    this.transactions = transactions;
    this.currency = currency;
  }
  
  /**
   * Calculate the total expenses from transactions
   */
  private calculateTotalExpenses(): number {
    return this.transactions.reduce((total, tx) => total + tx.amount, 0);
  }
  
  /**
   * Calculate the average transaction amount
   */
  private calculateAverageAmount(): number {
    if (this.transactions.length === 0) return 0;
    return this.calculateTotalExpenses() / this.transactions.length;
  }
  
  /**
   * Find the most used payment method
   */
  private findTopPaymentMethod(): { name: string; value: number } {
    // Group transactions by payment method
    const paymentMethodMap = new Map<string, number>();
    
    this.transactions.forEach(tx => {
      // Extract the name from the PaymentMethod object
      const methodName = tx.paymentMethod?.name || "Unknown";
      const existingAmount = paymentMethodMap.get(methodName) || 0;
      paymentMethodMap.set(methodName, existingAmount + tx.amount);
    });
    
    // Find the payment method with the highest total amount
    let topPaymentMethod = { name: 'None', value: 0 };
    
    paymentMethodMap.forEach((amount, name) => {
      if (amount > topPaymentMethod.value) {
        topPaymentMethod = { name, value: amount };
      }
    });
    
    return topPaymentMethod;
  }
  
  /**
   * Calculate total reward points from transactions
   */
  private generatePaymentMethodChartData(): Array<{ name: string; value: number; color: string }> {
    // Group transactions by payment method
    const paymentMethodMap = new Map<string, number>();
    
    this.transactions.forEach(tx => {
      // Extract the name from the PaymentMethod object
      const methodName = tx.paymentMethod?.name || "Unknown";
      const existingAmount = paymentMethodMap.get(methodName) || 0;
      paymentMethodMap.set(methodName, existingAmount + tx.amount);
    });
    
    // Generate colors for each payment method
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#6366F1', // indigo
      '#EF4444', // red
    ];
    
    // Convert to array with colors
    return Array.from(paymentMethodMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by amount in descending order
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));
  }
  
  /**
   * Generate category chart data
   */
  private generateCategoryChartData(): Array<{ name: string; value: number; color: string }> {
    if (!this.transactions.length) return [];
    
    // Create a map of category -> total amount
    const categoryMap = new Map<string, number>();
    
    // Group transactions by category
    this.transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      const existingAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, existingAmount + tx.amount);
    });
    
    // Generate colors for each category
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#6366F1', // indigo
      '#EF4444', // red
      '#14B8A6', // teal
      '#F97316', // orange
      '#8B5CF6'  // purple
    ];
    
    // Convert to array with colors
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by amount in descending order
      .slice(0, 10) // Take top 10 categories
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));
  }

  /**
   * Calculate total reward points from transactions
   */
  private calculateTotalRewardPoints(): number {
    return this.transactions.reduce((total, transaction) => {
      // Ensure reward points is a number
      const points = typeof transaction.rewardPoints === 'number' 
        ? transaction.rewardPoints 
        : 0;
      return total + points;
    }, 0);
  }
  
  /**
   * Filter transactions based on the selected time period
   */
  private filterTransactionsByPeriod(period: string): Transaction[] {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    switch (period) {
      case 'thisMonth':
        return this.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= startOfMonth;
        });
      case 'lastMonth':
        return this.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= startOfLastMonth && txDate < startOfMonth;
        });
      case 'last30Days':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return this.transactions.filter(tx => {
          const txDate = new Date(tx.date);
          return txDate >= thirtyDaysAgo;
        });
      default:
        return this.transactions;
    }
  }
  
  /**
   * Generate complete summary data
   */
public getSummaryData(
  period: string = 'thisMonth',
  includeRecurring: boolean = false,
  limit: number = 15
): SummaryData {
  // Filter transactions based on period
  const filteredTransactions = this.filterTransactionsByPeriod(period);
  
  // Include recurring transactions if requested, otherwise just use filtered transactions
  // Removed the filter for isRecurring as it doesn't exist on the Transaction type
  const processedTransactions = filteredTransactions;
  
  return {
    totalExpenses: this.calculateTotalExpenses(),
    transactionCount: processedTransactions.length,
    averageAmount: this.calculateAverageAmount(),
    topPaymentMethod: this.findTopPaymentMethod(),
    totalRewardPoints: this.calculateTotalRewardPoints(),
    paymentMethodChartData: this.generatePaymentMethodChartData(),
    categoryChartData: this.generateCategoryChartData()
  };
}
}
