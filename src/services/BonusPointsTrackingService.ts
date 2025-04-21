// src/services/BonusPointsTrackingService.ts

import { Transaction, PaymentMethod } from '@/types';
import { BaseService } from './core/BaseService';
import { dataService } from './core/DataService';

// Interface for cache object type
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Service for tracking used bonus points per payment method and month
 */
export class BonusPointsTrackingService extends BaseService {
  private static _instance: BonusPointsTrackingService;
  
  // Cache with 15-minute expiration - matching the BaseService.createCache return type
  private bonusPointsCache: Map<string, { value: number; timestamp: number }>;
  
  private constructor() {
    super();
    this.bonusPointsCache = this.createCache<number>(15 * 60 * 1000);
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
    const cachedValue = this.getCachedValue(this.bonusPointsCache, cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    try {
      // Try to query the database for used bonus points
      const { data, error, usedFallback } = await this.safeDbOperation<any>(
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
        (localData: string): { bonus_points: number }[] => {
          // Transform localStorage data to match database format by creating a single entry array
          // This fixes the type error by returning an array with the expected structure
          return [{ bonus_points: parseInt(localData, 10) }];
        }
      );
      
      if (!error && data) {
        // If we got data from the database, sum up the bonus points
        let totalBonusPoints: number;
        
        if (usedFallback) {
          // For fallback data, extract the value from our array wrapper
          totalBonusPoints = Array.isArray(data) && data.length > 0 ? 
            data[0].bonus_points : 0;
        } else {
          // For database data, sum up the points
          totalBonusPoints = Array.isArray(data) 
            ? data.reduce((sum, record: any) => sum + (record.bonus_points || 0), 0) 
            : 0;
        }
        
        // Update cache
        this.setCachedValue(this.bonusPointsCache, cacheKey, totalBonusPoints);
        
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
      
      // Add a small delay to ensure the transaction is fully committed to the database
      // This helps prevent foreign key constraint violations
      await new Promise<void>(resolve => setTimeout(resolve, 300));
      
      // Verify the transaction exists before trying to add bonus points
      const { data: transactionExists } = await this.supabase
        .from('transactions')
        .select('id')
        .eq('id', transactionId)
        .single();
        
      if (!transactionExists) {
        console.warn(`Transaction ${transactionId} not found in database. Falling back to local storage for bonus points.`);
        // Use local storage fallback
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const localStorageKey = `bonusPoints-${paymentMethodId}-${year}-${month}`;
        const currentValue = localStorage.getItem(localStorageKey) || '0';
        const updatedValue = parseInt(currentValue, 10) + bonusPoints;
        
        localStorage.setItem(localStorageKey, updatedValue.toString());
        
        // Invalidate cache
        const cacheKey = `${paymentMethodId}-${now.getFullYear()}-${now.getMonth()}`;
        this.bonusPointsCache.delete(cacheKey);
        
        return true;
      }
      
      // Check if this bonus point movement already exists to avoid conflict
      const { data: existingMovement } = await this.supabase
        .from('bonus_points_movements')
        .select('*')
        .eq('transaction_id', transactionId)
        .single();
        
      // If it already exists, update it instead of inserting
      if (existingMovement) {
        console.log('Updating existing bonus points movement for transaction:', transactionId);
        const { error } = await this.supabase
          .from('bonus_points_movements')
          .update({ bonus_points: bonusPoints })
          .eq('transaction_id', transactionId);
        
        if (error) {
          console.warn('Error updating bonus points movement:', error);
          // Continue with local storage fallback
        } else {
          // Success - invalidate cache and return
          const now = new Date();
          const cacheKey = `${paymentMethodId}-${now.getFullYear()}-${now.getMonth()}`;
          this.bonusPointsCache.delete(cacheKey);
          return true;
        }
      } else {
        // It doesn't exist, try to insert
        console.log('Creating new bonus points movement for transaction:', transactionId);
        const { error } = await this.supabase
          .from('bonus_points_movements')
          .insert({
            transaction_id: transactionId,
            payment_method_id: paymentMethodId,
            bonus_points: bonusPoints,
            created_at: new Date().toISOString()
          });
          
        if (error) {
          console.warn('Error inserting bonus points movement:', error, 'Transaction ID:', transactionId);
          // Continue with local storage fallback
        } else {
          // Success - invalidate cache and return
          const now = new Date();
          const cacheKey = `${paymentMethodId}-${now.getFullYear()}-${now.getMonth()}`;
          this.bonusPointsCache.delete(cacheKey);
          return true;
        }
      }
      
      // If we get here, use local storage fallback
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      const localStorageKey = `bonusPoints-${paymentMethodId}-${year}-${month}`;
      const currentValue = localStorage.getItem(localStorageKey) || '0';
      const updatedValue = parseInt(currentValue, 10) + bonusPoints;
      
      localStorage.setItem(localStorageKey, updatedValue.toString());
      
      // Invalidate cache
      const cacheKey = `${paymentMethodId}-${now.getFullYear()}-${now.getMonth()}`;
      this.bonusPointsCache.delete(cacheKey);
      
      return true;
    } catch (error) {
      console.warn('Exception in recordBonusPointsMovement:', error);
      
      // Even if there's an error, store in localStorage as fallback
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const localStorageKey = `bonusPoints-${paymentMethodId}-${year}-${month}`;
        const currentValue = localStorage.getItem(localStorageKey) || '0';
        const updatedValue = parseInt(currentValue, 10) + bonusPoints;
        
        localStorage.setItem(localStorageKey, updatedValue.toString());
      } catch (e) {
        console.error('Failed to save bonus points to localStorage:', e);
      }
      
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
