// src/utils/TransactionAnalyzer.ts
import { Transaction, PaymentMethod } from '@/types';

export class TransactionAnalyzer {
  /**
   * Group transactions by a specific attribute
   * @param transactions Array of transactions
   * @param groupBy Key to group by (e.g., 'category', 'paymentMethod')
   * @returns Map of grouped transactions
   */
  static groupTransactionsBy(
    transactions: Transaction[], 
    groupBy: keyof Transaction
  ): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      const key = String(transaction[groupBy] || 'Uncategorized');
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(transaction);
    });
    
    return groups;
  }

  /**
   * Calculate total spending for a group of transactions
   * @param transactions Array of transactions
   * @returns Total spending amount
   */
  static calculateTotalSpending(transactions: Transaction[]): number {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }

  /**
   * Find the top payment method based on total spending
   * @param transactions Array of transactions
   * @param paymentMethods Available payment methods
   * @returns Top payment method object
   */
  static findTopPaymentMethod(
    transactions: Transaction[], 
    paymentMethods: PaymentMethod[]
  ): { name: string; value: number } {
    const methodSpending = new Map<string, number>();
    
    transactions.forEach(tx => {
      const methodId = tx.paymentMethod?.id;
      if (methodId) {
        methodSpending.set(
          methodId, 
          (methodSpending.get(methodId) || 0) + tx.amount
        );
      }
    });
    
    let topMethodId = '';
    let maxSpending = 0;
    
    methodSpending.forEach((value, key) => {
      if (value > maxSpending) {
        maxSpending = value;
        topMethodId = key;
      }
    });
    
    const topMethod = paymentMethods.find(m => m.id === topMethodId);
    
    return {
      name: topMethod?.name || 'Unknown',
      value: maxSpending
    };
  }

  /**
   * Calculate percentage change between current and previous period
   * @param currentValue Current period value
   * @param previousValue Previous period value
   * @returns Percentage change
   */
  static calculatePercentageChange(
    currentValue: number, 
    previousValue: number
  ): number {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Group transactions by time period
   * @param transactions Array of transactions
   * @param period Grouping period (day, week, month, year)
   * @returns Map of transactions grouped by period
   */
  static groupTransactionsByPeriod(
    transactions: Transaction[], 
    period: 'day' | 'week' | 'month' | 'year'
  ): Map<string, Transaction[]> {
    const groups = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      
      let key = '';
      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the Monday of the week
          const day = date.getDay() || 7; // Convert Sunday (0) to 7
          const mondayDate = new Date(date);
          mondayDate.setDate(date.getDate() - day + 1);
          key = mondayDate.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = `${date.getFullYear()}`;
          break;
      }
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(transaction);
    });
    
    return groups;
  }
}
