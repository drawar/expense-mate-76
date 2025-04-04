
import { BaseCalculator, CalculationInput } from './BaseCalculator';

/**
 * Calculator for DBS Woman's World MasterCard
 * Rules:
 * - 1x DBS Point for every S$5 spent (base rate)
 * - 9x bonus DBS Points for online transactions
 * - Monthly cap of 2,700 bonus points
 */
export class DBSWomansWorldCalculator extends BaseCalculator {
  // Monthly cap for bonus points
  private readonly MONTHLY_BONUS_CAP = 2700;

  constructor() {
    // Use nearest rounding strategy
    super('nearest');
  }

  /**
   * Get the points currency
   */
  public override getPointsCurrency(): string {
    return 'DBS Points';
  }

  /**
   * Calculate base points for DBS Woman's World Card
   * 1 DBS Point for every S$5 spent
   */
  protected calculateBasePoints(roundedAmount: number, input: CalculationInput): number {
    // Round down to nearest 5 for base points
    const basePointsAmount = Math.floor(roundedAmount / 5) * 5;
    const basePoints = basePointsAmount / 5;
    return Math.round(basePoints);
  }

  /**
   * Calculate bonus points for DBS Woman's World Card
   * 9x bonus DBS Points for online transactions
   */
  protected calculateBonusPoints(roundedAmount: number, input: CalculationInput): { 
    bonusPoints: number; 
    remainingMonthlyBonusPoints?: number;
  } {
    // Check if transaction is online
    if (!input.isOnline) {
      return { bonusPoints: 0 };
    }

    // Calculate potential bonus points (9 points per $5)
    const basePointsAmount = Math.floor(roundedAmount / 5) * 5;
    const basePoints = basePointsAmount / 5;
    const potentialBonusPoints = basePoints * 9; // 9x multiplier for online

    // Apply monthly cap
    const usedBonusPoints = input.usedBonusPoints || 0;
    const remainingCap = Math.max(0, this.MONTHLY_BONUS_CAP - usedBonusPoints);

    if (remainingCap <= 0) {
      return {
        bonusPoints: 0,
        remainingMonthlyBonusPoints: 0
      };
    }

    const actualBonusPoints = Math.min(potentialBonusPoints, remainingCap);
    return {
      bonusPoints: Math.round(actualBonusPoints),
      remainingMonthlyBonusPoints: remainingCap - actualBonusPoints
    };
  }
}
