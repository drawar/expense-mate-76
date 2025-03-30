// src/services/BonusPointsTrackingService.ts
import { Transaction, PaymentMethod } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { rewardCalculationService } from '@/services/RewardCalculationService';

/**
 * Service for tracking used bonus points per payment method and month
 */
export class BonusPointsTrackingService {
  private static instance: BonusPointsTrackingService;
  
  // In-memory cache for performance
  private bonusPointsCache: Map<string, number> = new Map();
  
  private constructor() {}
  
  /**
   * Get the singleton instance of the BonusPointsTrackingService
   */
  public static getInstance(): BonusPointsTrackingService {
    if (!BonusPointsTrackingService.instance) {
      BonusPointsTrackingService.instance = new BonusPointsTrackingService();
    }
    return BonusPointsTrackingService.instance;
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
    if (this.bonusPointsCache.has(cacheKey)) {
      return this.bonusPointsCache.get(cacheKey) || 0;
    }
    
    try {
      // Query the database for used bonus points
      const { data, error } = await supabase
        .from('bonus_points_movements')
        .select('bonus_points')
        .eq('payment_method_id', paymentMethodId)
        .gte('created_at', new Date(year, month, 1).toISOString())
        .lt('created_at', new Date(year, month + 1, 1).toISOString());
        
      if (error) {
        console.error('Error fetching bonus points:', error);
        return 0;
      }
      
      // Sum up the bonus points
      const totalBonusPoints = data.reduce((sum, record) => sum + record.bonus_points, 0);
      
      // Update cache
      this.bonusPointsCache.set(cacheKey, totalBonusPoints);
      
      return totalBonusPoints;
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
      
      // Record the movement in the database
      const { error } = await supabase
        .from('bonus_points_movements')
        .insert({
          transaction_id: transactionId,
          payment_method_id: paymentMethodId,
          bonus_points: bonusPoints
        });
        
      if (error) {
        console.error('Error recording bonus points movement:', error);
        return false;
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
    let totalBonusPoints = 0;
    
    for (const tx of relevantTransactions) {
      // Calculate the bonus points for this transaction
      const result = rewardCalculationService.calculatePoints(tx, 0); // Assuming no cap applied yet
      totalBonusPoints += result.bonusPoints;
    }
    
    return totalBonusPoints;
  }
  
  /**
   * Get remaining bonus points for a payment method
   */
  public async getRemainingBonusPoints(
    paymentMethod: PaymentMethod,
    usedBonusPoints?: number
  ): Promise<number> {
    // Get the card info to determine the monthly cap
    // This should ideally be fetched from a centralized configuration or card registry
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
