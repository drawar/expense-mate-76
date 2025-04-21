// src/services/PointsTrackingService.ts

import { Transaction, PaymentMethod } from '@/types';
import { BaseService } from './core/BaseService';
import { dataService } from './core/DataService';

// Define the triggering action type
export type TriggeringAction = 'add' | 'edit' | 'delete';

// Interface for cache object type
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

// Interface for points movement
interface PointsMovement {
  transaction_id: string;
  payment_method_id: string;
  base_points: number;
  bonus_points: number;
  created_at?: string;
  triggering_action: TriggeringAction;
}

/**
 * Service for tracking used points per payment method and month
 */
export class PointsTrackingService extends BaseService {
  private static _instance: PointsTrackingService;
  
  // Cache with 15-minute expiration - matching the BaseService.createCache return type
  private bonusPointsCache: Map<string, { value: number; timestamp: number }>;
  private basePointsCache: Map<string, { value: number; timestamp: number }>;
  
  private constructor() {
    super();
    this.bonusPointsCache = this.createCache<number>(15 * 60 * 1000);
    this.basePointsCache = this.createCache<number>(15 * 60 * 1000);
  }
  
  /**
   * Get the singleton instance of the PointsTrackingService
   */
  public static getInstance(): PointsTrackingService {
    if (!PointsTrackingService._instance) {
      PointsTrackingService._instance = new PointsTrackingService();
    }
    return PointsTrackingService._instance;
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
            .from('points_movements')
            .select('bonus_points')
            .eq('payment_method_id', paymentMethodId)
            .gte('created_at', new Date(year, month, 1).toISOString())
            .lt('created_at', new Date(year, month + 1, 1).toISOString());
            
          return result;
        },
        `bonusPoints-${paymentMethodId}-${year}-${month}`,
        (localData: string): { bonus_points: number }[] => {
          // Transform localStorage data to match database format by creating a single entry array
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
   * Get used base points for a payment method in the current month
   */
  public async getUsedBasePoints(
    paymentMethodId: string,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth()
  ): Promise<number> {
    // Check cache first
    const cacheKey = `${paymentMethodId}-${year}-${month}`;
    const cachedValue = this.getCachedValue(this.basePointsCache, cacheKey);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    try {
      // Try to query the database for used base points
      const { data, error, usedFallback } = await this.safeDbOperation<any>(
        async () => {
          const result = await this.supabase
            .from('points_movements')
            .select('base_points')
            .eq('payment_method_id', paymentMethodId)
            .gte('created_at', new Date(year, month, 1).toISOString())
            .lt('created_at', new Date(year, month + 1, 1).toISOString());
            
          return result;
        },
        `basePoints-${paymentMethodId}-${year}-${month}`,
        (localData: string): { base_points: number }[] => {
          // Transform localStorage data to match database format
          return [{ base_points: parseInt(localData, 10) }];
        }
      );
      
      if (!error && data) {
        // If we got data from the database, sum up the base points
        let totalBasePoints: number;
        
        if (usedFallback) {
          // For fallback data, extract the value from our array wrapper
          totalBasePoints = Array.isArray(data) && data.length > 0 ? 
            data[0].base_points : 0;
        } else {
          // For database data, sum up the points
          totalBasePoints = Array.isArray(data) 
            ? data.reduce((sum, record: any) => sum + (record.base_points || 0), 0) 
            : 0;
        }
        
        // Update cache
        this.setCachedValue(this.basePointsCache, cacheKey, totalBasePoints);
        
        return totalBasePoints;
      }
      
      return 0;
    } catch (error) {
      console.error('Exception in getUsedBasePoints:', error);
      return 0;
    }
  }
  
  /**
   * Record a points movement for transaction creation (triggering_action = "add")
   * 
   * @param transactionId - ID of the transaction
   * @param paymentMethodId - ID of the payment method
   * @param basePoints - Number of base points
   * @param bonusPoints - Number of bonus points
   * @returns Promise resolving to a boolean indicating success
   */
  public async recordPointsMovementForAdd(
    transactionId: string,
    paymentMethodId: string,
    basePoints: number,
    bonusPoints: number
  ): Promise<boolean> {
    // Skip recording if both points are zero
    if (basePoints === 0 && bonusPoints === 0) return true;
    
    try {
      // Verify the transaction exists before trying to add points
      const { data: transactionExists } = await this.supabase
        .from('transactions')
        .select('id')
        .eq('id', transactionId)
        .single();
        
      if (!transactionExists) {
        console.warn(`Transaction ${transactionId} not found in database. Skipping points recording.`);
        return false;
      }
      
      // Create the points movement (without triggering_action field)
      const movement = {
        transaction_id: transactionId,
        payment_method_id: paymentMethodId,
        base_points: basePoints,
        bonus_points: bonusPoints,
        created_at: new Date().toISOString()
        // triggering_action field removed as it doesn't exist in the database
      };
      
      console.log('Creating new points movement for transaction:', transactionId);
      const { error } = await this.supabase
        .from('points_movements')
        .insert(movement);
        
      if (error) {
        console.warn('Error inserting points movement:', error, 'Transaction ID:', transactionId);
        return false;
      }
      
      // Success - invalidate cache
      this.invalidateCache(paymentMethodId);
      return true;
    } catch (error) {
      console.warn('Exception in recordPointsMovementForAdd:', error);
      return false;
    }
  }
  
  /**
   * Record points movements for transaction edit (triggering_action = "edit")
   * Creates a contra entry for the previous points and a new entry for the updated points
   * 
   * @param transactionId - ID of the transaction
   * @param paymentMethodId - ID of the payment method
   * @param previousBasePoints - Previous base points value
   * @param newBasePoints - New base points value
   * @param previousBonusPoints - Previous bonus points value
   * @param newBonusPoints - New bonus points value
   * @returns Promise resolving to a boolean indicating success
   */
  public async recordPointsMovementForEdit(
    transactionId: string,
    paymentMethodId: string,
    previousBasePoints: number,
    newBasePoints: number,
    previousBonusPoints: number,
    newBonusPoints: number
  ): Promise<boolean> {
    try {
      // If both previous and new values are zero, nothing to do
      if (previousBasePoints === 0 && newBasePoints === 0 && 
          previousBonusPoints === 0 && newBonusPoints === 0) {
        return true;
      }
      
      // Verify the transaction exists
      const { data: transactionExists } = await this.supabase
        .from('transactions')
        .select('id')
        .eq('id', transactionId)
        .single();
        
      if (!transactionExists) {
        console.warn(`Transaction ${transactionId} not found in database. Skipping points recording.`);
        return false;
      }
      
      const timestamp = new Date().toISOString();
      
      // 1. Create a contra entry with negative values of the previous points if any were non-zero
      if (previousBasePoints !== 0 || previousBonusPoints !== 0) {
        const contraMovement = {
          transaction_id: transactionId,
          payment_method_id: paymentMethodId,
          base_points: -previousBasePoints, // Negative to offset previous points
          bonus_points: -previousBonusPoints, // Negative to offset previous points
          created_at: timestamp
          // triggering_action field removed as it doesn't exist in the database
        };
        
        console.log('Creating contra entry for previous points:', transactionId);
        const { error: contraError } = await this.supabase
          .from('points_movements')
          .insert(contraMovement);
          
        if (contraError) {
          console.warn('Error creating contra entry:', contraError);
          return false;
        }
      }
      
      // 2. Create a new entry with the new points values if any are non-zero
      if (newBasePoints !== 0 || newBonusPoints !== 0) {
        const newMovement = {
          transaction_id: transactionId,
          payment_method_id: paymentMethodId,
          base_points: newBasePoints,
          bonus_points: newBonusPoints,
          created_at: timestamp
          // triggering_action field removed as it doesn't exist in the database
        };
        
        console.log('Creating new entry for updated points:', transactionId);
        const { error: newError } = await this.supabase
          .from('points_movements')
          .insert(newMovement);
          
        if (newError) {
          console.warn('Error creating new entry:', newError);
          return false;
        }
      }
      
      // Success - invalidate cache
      this.invalidateCache(paymentMethodId);
      return true;
    } catch (error) {
      console.warn('Exception in recordPointsMovementForEdit:', error);
      return false;
    }
  }
  
  /**
   * Record a points movement for transaction deletion (triggering_action = "delete")
   * Creates a contra entry to offset the original points
   * 
   * @param transactionId - ID of the transaction
   * @param paymentMethodId - ID of the payment method
   * @param basePoints - Base points to be removed (will be reversed)
   * @param bonusPoints - Bonus points to be removed (will be reversed)
   * @returns Promise resolving to a boolean indicating success
   */
  public async recordPointsMovementForDelete(
    transactionId: string,
    paymentMethodId: string,
    basePoints: number,
    bonusPoints: number
  ): Promise<boolean> {
    // Skip recording if both points are zero
    if (basePoints === 0 && bonusPoints === 0) return true;
    
    try {
      // Create a contra entry (without triggering_action field)
      const contraMovement = {
        transaction_id: transactionId,
        payment_method_id: paymentMethodId,
        base_points: -basePoints, // Negative to offset the points
        bonus_points: -bonusPoints, // Negative to offset the points
        created_at: new Date().toISOString()
        // triggering_action field removed as it doesn't exist in the database
      };
      
      console.log('Creating contra entry for deleted transaction:', transactionId);
      const { error } = await this.supabase
        .from('points_movements')
        .insert(contraMovement);
        
      if (error) {
        console.warn('Error creating contra entry for deletion:', error);
        return false;
      }
      
      // Success - invalidate cache
      this.invalidateCache(paymentMethodId);
      return true;
    } catch (error) {
      console.warn('Exception in recordPointsMovementForDelete:', error);
      return false;
    }
  }
  
  /**
   * Helper method to invalidate the cache for a payment method
   */
  private invalidateCache(paymentMethodId: string): void {
    const now = new Date();
    const cacheKey = `${paymentMethodId}-${now.getFullYear()}-${now.getMonth()}`;
    this.bonusPointsCache.delete(cacheKey);
    this.basePointsCache.delete(cacheKey);
  }
  
  /**
   * Check if a points movement exists for a transaction
   */
  public async getPointsMovement(transactionId: string): Promise<any> {
    try {
      // Using proper query structure with .eq() method
      const { data, error } = await this.supabase
        .from('points_movements')
        .select('*')
        .eq('transaction_id', transactionId)
        .maybeSingle();
        
      if (error) {
        console.warn('Error getting points movement:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Exception in getPointsMovement:', error);
      return null;
    }
  }
  
  /**
   * Calculate used points from a set of transactions
   * Useful when we don't have direct access to the points_movements table
   */
  public calculateUsedPointsFromTransactions(
    transactions: Transaction[],
    paymentMethodId: string,
    year: number = new Date().getFullYear(),
    month: number = new Date().getMonth()
  ): {basePoints: number, bonusPoints: number} {
    // Filter transactions by payment method and month
    const relevantTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return tx.paymentMethod.id === paymentMethodId &&
             txDate.getFullYear() === year &&
             txDate.getMonth() === month;
    });
    
    // Calculate total points used
    const result = relevantTransactions.reduce((total, tx) => ({
      basePoints: total.basePoints + (tx.basePoints || 0),
      bonusPoints: total.bonusPoints + (tx.bonusPoints || 0)
    }), {basePoints: 0, bonusPoints: 0});
    
    return result;
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
   * Clear the points cache
   */
  public clearCache(): void {
    this.bonusPointsCache.clear();
    this.basePointsCache.clear();
  }
}

// Export a singleton instance for easy access
export const pointsTrackingService = PointsTrackingService.getInstance();

// For backwards compatibility
export const bonusPointsTrackingService = pointsTrackingService;