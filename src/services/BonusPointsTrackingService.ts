// src/services/BonusPointsTrackingService.ts

import { Transaction, PaymentMethod } from '@/types';
import { BaseService } from './core/BaseService';
import { dataService } from './core/DataService';

/**
 * Service for tracking used bonus points per payment method and month
 */
export class BonusPointsTrackingService extends BaseService {
  private static _instance: BonusPointsTrackingService;
  
  // Cache with 15-minute expiration
  private bonusPointsCache = this.createCache<number>(15 * 60 * 1000);
  
  private constructor() {
    super();
  }
  
  /**
   * Get the singleton instance of the BonusPointsTrackingService
   */
  public static getInstance(): BonusPointsTrackingService {
    if (!BonusPointsTrackingService._instance) {
      BonusPointsTrackingService._instance = new BonusPointsTrackingService();
    }
    return BonusPointsTrackingService._instance;
  }
  
  /**
   * Get used bonus points for a payment method in the current month
   */
  public async getUsedBonusPoints(
    paymentMethodId: string,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth()
  ): Promise<number> {
    // Check cache first
    const cacheKey = `${paymentMethodId}-${year}-${month}`;
    const cachedValue = this.bonusPointsCache.get(cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    try {
      // Try to query the database for used bonus points
      const { data, error, usedFallback } = await this.safeDbOperation(
        async () => {
          const result = await this.supabase
            .from('bonus_points_movements')
            .select('bonus_points')
            .eq('payment_method_id', paymentMethodId)
            .gte('created_at', new Date(year, month, 1).toISOString())
            .lt('created_at', new Date(year, month + 1, 1).toISOString());
            
          return result;
        },
        `bonusPoints-${paymentMethodId}-${year}-${month}`,
        (localData) => {
          // Transform localStorage data to match database format
          return parseInt(localData, 10);
        }
      );
      
      if (!error && data) {
        // If we got data from the database, sum up the bonus points
        let totalBonusPoints: number;
        
        if (usedFallback) {
          // For fallback data, it's already the total
          totalBonusPoints = data as unknown as number;
        } else {
          // For database data, sum up the points
          totalBonusPoints = data.reduce((sum, record) => sum + record.bonus_points, 0);
        }
        
        // Update cache
        this.bonusPointsCache.set(cacheKey, totalBonusPoints);
        
        return totalBonusPoints;
      }
      
      return 0;
    } catch (error) {
      console.error('Exception in getUsedBonusPoints:', error);
      return 0;
    }
  }
  
  /**
   * Record a bonus points movement
   */
  public async recordBonusPointsMovement(
    transactionId: string,
    paymentMethodId: string,
    bonusPoints: number
  ): Promise<boolean> {
    try {
      // Skip recording if bonus points is zero
      if (bonusPoints === 0) return true;
      
      // Try to record in the database
      const { error, usedFallback } = await this.safeDbOperation(
        async () => {
          const result = await this.supabase
            .from('bonus_points_movements')
            .insert({
              transaction_id: transactionId,
              payment_method_id: paymentMethodId,
              bonus_points: bonusPoints,
              created_at: new Date().toISOString()
            });
            
          return result;
        },
        // No fallback key needed as we handle localStorage fallback specifically below
      );
      
      if (error) {
        // If database insert fails, fall back to localStorage
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const localStorageKey = `bonusPoints-${paymentMethodId}-${year}-${month}`;
        const currentValue = localStorage.getItem(localStorageKey) || '0';
        const updatedValue = parseInt(currentValue, 10) + bonusPoints;
        
        localStorage.setItem(localStorageKey, updatedValue.toString());
      }
      
      // Invalidate cache
      const now = new Date();
      const cacheKey = `${paymentMethodId}-${now.getFullYear()}-${now.getMonth()}`;
      this.bonusPointsCache.delete(cacheKey);
      
      return true;
    } catch (error) {
      console.error('Exception in recordBonusPointsMovement:', error);
      return false;
    }
  }
  
  /**
   * Calculate used bonus points from a set of transactions
   * Useful when we don't have direct access to the bonus_points_movements table
   */
  public calculateUsedBonusPointsFromTransactions(
    transactions: Transaction[],
    paymentMethodId: string,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth()
  ): number {
    // Filter transactions by payment method and month
    const relevantTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.paymentMethod.id === paymentMethodId &&
             txDate.getFullYear() === year &&
             txDate.getMonth() === month;
    });
    
    // Calculate total bonus points used
    return relevantTransactions.reduce((total, tx) => total + (tx.bonusPoints || 0), 0);
  }
  
  /**
   * Get remaining bonus points for a payment method
   */
  public async getRemainingBonusPoints(
    paymentMethod: PaymentMethod,
    usedBonusPoints?: number
  ): Promise<number> {
    // Get the card info to determine the monthly cap
    const monthlyCapByCard: Record<string, number> = {
      'UOB Preferred Visa Platinum': 4000,
      'Citibank Rewards Visa Signature': 4000,
      'UOB Visa Signature': 8000,
      'UOB Lady\'s Solitaire': 7200
    };
    
    // Safely access card name
    const cardName = paymentMethod.name || '';
    const defaultCap = 0; // No cap by default
    const cap = monthlyCapByCard[cardName] || defaultCap;
    
    // If cap is 0 (unlimited), return a large number
    if (cap === 0) return Number.MAX_SAFE_INTEGER;
    
    // If usedBonusPoints is provided, use it directly
    if (usedBonusPoints !== undefined) {
      return Math.max(0, cap - usedBonusPoints);
    }
    
    // Otherwise, fetch from database
    const actualUsedPoints = await this.getUsedBonusPoints(paymentMethod.id);
    return Math.max(0, cap - actualUsedPoints);
  }
  
  /**
   * Clear the bonus points cache
   */
  public clearCache(): void {
    this.bonusPointsCache.clear();
  }
}

// Export a singleton instance for easy access
export const bonusPointsTrackingService = BonusPointsTrackingService.getInstance();
