// services/rewards/MonthlySpendingTracker.ts

import { Transaction } from '@/types';
import { BaseService } from '../core/BaseService';
import { SpendingPeriodType } from './types';
import { dateService } from '../core/DateService';
import { dataService } from '../core/DataService';

/**
 * Service for tracking monthly spending for reward rules
 */
export class MonthlySpendingTracker extends BaseService {
  private static _instance: MonthlySpendingTracker;
  
  // Cache with 15-minute expiration
  private spendingCache = this.createCache<number>(15 * 60 * 1000);
  
  private constructor() {
    super();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MonthlySpendingTracker {
    if (!this._instance) {
      this._instance = new MonthlySpendingTracker();
    }
    return this._instance;
  }
  
  /**
   * Get total monthly spending for a payment method
   */
  public async getMonthlySpending(
    paymentMethodId: string,
    periodType: SpendingPeriodType = 'calendar_month',
    date: Date = new Date(),
    statementDay: number = 1
  ): Promise<number> {
    // Create a cache key
    const cacheKey = this.createCacheKey(paymentMethodId, periodType, date, statementDay);
    
    // Check cache first
    const cachedValue = this.spendingCache.get(cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    try {
      // Calculate date range using the DateService
      const { startDate, endDate } = dateService.calculateDateRange(date, periodType, statementDay);
      
      // Query database for transactions in this period
      const { data, error } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('transactions')
            .select('amount')
            .eq('payment_method_id', paymentMethodId)
            .gte('date', startDate.toISOString())
            .lt('date', endDate.toISOString())
            .eq('is_deleted', false);
        }
      );
        
      if (error || !data) {
        console.error('Error fetching monthly spending:', error);
        return 0;
      }
      
      // Calculate total
      const totalSpending = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      // Cache the result
      this.spendingCache.set(cacheKey, totalSpending);
      
      return totalSpending;
    } catch (error) {
      console.error('Error calculating monthly spending:', error);
      return 0;
    }
  }
  
  /**
   * Calculate monthly spending from an array of transactions
   * Useful when we don't have direct database access
   */
  public calculateMonthlySpendingFromTransactions(
    transactions: Transaction[],
    paymentMethodId: string,
    periodType: SpendingPeriodType = 'calendar_month',
    date: Date = new Date(),
    statementDay: number = 1
  ): number {
    try {
      // Calculate date range using the DateService
      const { startDate, endDate } = dateService.calculateDateRange(date, periodType, statementDay);
      
      // Filter transactions by date range and payment method
      const relevantTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return tx.paymentMethod.id === paymentMethodId &&
               txDate >= startDate &&
               txDate < endDate;
      });
      
      // Calculate total
      return relevantTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    } catch (error) {
      console.error('Error calculating monthly spending from transactions:', error);
      return 0;
    }
  }
  
  /**
   * Update monthly spending when a new transaction is added
   */
  public updateMonthlySpending(transaction: Transaction): void {
    // Clear all cache entries for this payment method
    this.clearCacheForPaymentMethod(transaction.paymentMethod.id);
  }
  
  /**
   * Clear cache for a payment method
   */
  public clearCacheForPaymentMethod(paymentMethodId: string): void {
    const keysToDelete: string[] = [];
    
    // Find all cache keys for this payment method
    for (const key of Object.keys(this.spendingCache)) {
      if (key.startsWith(`${paymentMethodId}-`)) {
        keysToDelete.push(key);
      }
    }
    
    // Delete from cache
    keysToDelete.forEach(key => this.spendingCache.delete(key));
  }
  
  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.spendingCache.clear();
  }
  
  /**
   * Create a cache key
   */
  private createCacheKey(
    paymentMethodId: string,
    periodType: SpendingPeriodType,
    date: Date,
    statementDay: number
  ): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${paymentMethodId}-${periodType}-${year}-${month}-${statementDay}`;
  }
}

// Export a singleton instance
export const monthlySpendingTracker = MonthlySpendingTracker.getInstance();
