
import { BaseCalculator, CalculationInput } from './BaseCalculator';

/**
 * Calculator for DBS Woman's World Mastercard
 * - 10x DBS Points (or 20 miles per S$5) on online spend
 * - 1x DBS Points (or 2 miles per S$5) on all other spend
 * - Monthly cap of 2,000 DBS Points for bonus points
 */
export class DBSWomansWorldCalculator extends BaseCalculator {
  // Monthly cap of 2,000 bonus points
  private readonly monthlyCap = 2000;
  
  /**
   * Calculate base points - 1 point per dollar
   */
  protected calculateBasePoints(roundedAmount: number, input: CalculationInput): number {
    // Base rate is 1 DBS Point per S$5 spent (0.2 per dollar)
    return Math.floor(roundedAmount * 0.2);
  }
  
  /**
   * Calculate bonus points - 9 additional points per dollar for online transactions
   */
  protected calculateBonusPoints(roundedAmount: number, input: CalculationInput): { 
    bonusPoints: number; 
    remainingMonthlyBonusPoints?: number;
  } {
    // Check if this is an online transaction - critical for bonus points
    if (!input.isOnline) {
      console.log('DBSWomansWorldCalculator: Not eligible for bonus points - not online transaction');
      return { bonusPoints: 0 };
    }
    
    console.log('DBSWomansWorldCalculator: Online transaction detected, calculating bonus points');
    
    // Calculate potential bonus points (9x on top of base points)
    // Base is 0.2, bonus is 1.8 = total 2.0 per dollar 
    const potentialBonusPoints = Math.floor(roundedAmount * 1.8);
    
    // Apply monthly cap
    const usedBonusPoints = input.usedBonusPoints || 0;
    const remainingCap = Math.max(0, this.monthlyCap - usedBonusPoints);
    
    // Calculate actual bonus points based on remaining cap
    const actualBonusPoints = Math.min(potentialBonusPoints, remainingCap);
    
    console.log('DBSWomansWorldCalculator bonus calculation:', {
      potentialBonusPoints,
      usedBonusPoints,
      remainingCap,
      actualBonusPoints
    });
    
    return {
      bonusPoints: actualBonusPoints,
      remainingMonthlyBonusPoints: remainingCap - actualBonusPoints
    };
  }
  
  /**
   * Get points currency
   */
  public override getPointsCurrency(input?: CalculationInput): string {
    return 'DBS Points';
  }
}
