/**
 * Base interface for card calculation inputs
 * (matches closely with BaseRewardCardProps but without React dependencies)
 */
export interface CalculationInput {
  amount: number;
  mcc?: string;
  isOnline?: boolean;
  isContactless?: boolean;
  currency?: string;
  merchantName?: string;
  
  // Tracking properties
  usedBonusPoints?: number;
  nonSgdSpendTotal?: number;
  hasSgdTransactions?: boolean;
  monthlySpendByCategory?: Record<string, number>;
  selectedCategories?: string[];
  
  // Payment method for card-specific configurations
  paymentMethod?: {
    id: string;
    type: 'cash' | 'credit_card';
    name: string;
    currency: string;
    issuer?: string;
    selectedCategories?: string[];
    [key: string]: any;
  };
}

/**
 * Interface for calculation results 
 */
export interface CalculationResult {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  pointsCurrency?: string;
  remainingMonthlyBonusPoints?: number;
  messageText?: string;
}

/**
 * Interface for bonus point caps
 */
export interface BonusPointsCap {
  maxBonusPoints: number;
  applyCap(calculatedBonus: number, usedBonusPoints: number): number;
  getRemainingBonusPoints(usedBonusPoints: number, newBonusPoints: number): number;
}

/**
 * Standard monthly cap implementation
 */
export class MonthlyCap implements BonusPointsCap {
  constructor(public maxBonusPoints: number) {}

  applyCap(calculatedBonus: number, usedBonusPoints: number): number {
    return Math.min(calculatedBonus, this.maxBonusPoints - (usedBonusPoints || 0));
  }

  getRemainingBonusPoints(usedBonusPoints: number, newBonusPoints: number): number {
    return Math.max(0, this.maxBonusPoints - (usedBonusPoints || 0) - newBonusPoints);
  }
}

/**
 * Abstract base class for all reward calculators
 */
export abstract class BaseCalculator {
  /**
   * Calculate rewards for a transaction
   */
  calculate(input: CalculationInput): CalculationResult {
    return this.calculateRewards(input);
  }

  /**
   * Calculates reward points for a transaction (used by RewardCalculationService)
   */
  calculateRewards(input: CalculationInput): CalculationResult {
    const { amount, usedBonusPoints = 0 } = input;
    const roundedAmount = this.calculateRoundedAmount(amount);
    const basePoints = this.calculateBasePoints(roundedAmount);
    
    const isEligible = this.getBonusPointsEligibility(input);
    const potentialBonusPoints = isEligible ? this.calculateBonusPoints(roundedAmount, input) : 0;
    
    const bonusPointsCap = this.getBonusPointsCap();
    const actualBonusPoints = bonusPointsCap.applyCap(potentialBonusPoints, usedBonusPoints);
    
    const remainingBonusPoints = bonusPointsCap.getRemainingBonusPoints(
      usedBonusPoints,
      actualBonusPoints
    );

    // Generate bonus point message if eligible but capped
    let messageText = "";
    if (potentialBonusPoints > 0 && actualBonusPoints === 0) {
      messageText = "Monthly cap reached";
    }

    return {
      basePoints,
      bonusPoints: actualBonusPoints,
      totalPoints: basePoints + actualBonusPoints,
      remainingMonthlyBonusPoints: remainingBonusPoints,
      messageText,
      pointsCurrency: this.getPointsCurrency()
    };
  }

  // Abstract methods that must be implemented by subclasses
  protected abstract calculateRoundedAmount(amount: number): number;
  protected abstract calculateBasePoints(roundedAmount: number): number;
  protected abstract getBonusPointsEligibility(input: CalculationInput): boolean;
  protected abstract calculateBonusPoints(roundedAmount: number, input: CalculationInput): number;
  protected abstract getBonusPointsCap(): BonusPointsCap;
  protected abstract getPointsCurrency(): string;
  
  /**
   * Public accessor for the points currency
   */
  public getPointsCurrencyPublic(): string {
    return this.getPointsCurrency();
  }
}