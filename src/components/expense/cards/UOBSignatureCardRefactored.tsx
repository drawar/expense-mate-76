import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, RewardRule, RewardRuleFactory } from './BaseRewardCard';

/**
 * Special cap implementation for UOB Signature Card
 * which has a combined monthly cap rather than separate base/bonus caps
 */
export class CombinedPointsCap {
  constructor(public maxTotalPoints: number) {}

  applyCap(basePoints: number, bonusPoints: number): { cappedBasePoints: number, cappedBonusPoints: number } {
    const totalPoints = basePoints + bonusPoints;
    
    if (totalPoints <= this.maxTotalPoints) {
      return { cappedBasePoints: basePoints, cappedBonusPoints: bonusPoints };
    }
    
    // If over cap, prioritize bonus points since they're more valuable
    const cappedBonusPoints = Math.min(bonusPoints, this.maxTotalPoints);
    const remainingPoints = Math.max(0, this.maxTotalPoints - cappedBonusPoints);
    const cappedBasePoints = Math.min(basePoints, remainingPoints);
    
    return { cappedBasePoints, cappedBonusPoints };
  }
}

/**
 * Extended props interface for UOBSignatureCard
 */
export interface UOBSignatureCardProps extends BaseRewardCardProps {
  // Required properties specific to this card
  currency: string;
  nonSgdSpendTotal: number;
  hasSgdTransactions: boolean;
}

/**
 * Custom BonusPointRule for non-SGD currency with minimum spend threshold
 */
export class ForeignCurrencyBonusRule implements RewardRule {
  constructor(
    private minSpendThreshold: number,
    private bonusMultiplier: number
  ) {}
  
  isEligible(props: UOBSignatureCardProps): boolean {
    // Must be non-SGD currency
    if (props.currency === 'SGD') return false;
    
    // Must not have SGD transactions in the statement
    if (props.hasSgdTransactions) return false;
    
    // Must meet minimum spend threshold when combining all foreign currency spend
    const totalForeignSpend = props.nonSgdSpendTotal + props.amount;
    return totalForeignSpend >= this.minSpendThreshold;
  }
  
  calculatePoints(props: UOBSignatureCardProps): number {
    // If eligible, calculate points based on total foreign spend (after rounding)
    const roundedAmount = Math.floor(props.nonSgdSpendTotal / 5) * 5;
    return Math.round((roundedAmount / 5) * this.bonusMultiplier);
  }
}

/**
 * UOB Signature Card Implementation using the OOP approach
 * 
 * This demonstrates a more complex implementation with currency-based rules
 * and a different capping mechanism.
 */
export class UOBSignatureCardRefactored extends BaseRewardCard<UOBSignatureCardProps> {
  // Define card-specific rules
  private readonly foreignCurrencyRule = new ForeignCurrencyBonusRule(1000, 18);
  private readonly pointsCap = new CombinedPointsCap(8000);
  
  // Implement required abstract methods

  /**
   * UOB Signature rounds down to the nearest $5
   */
  calculateRoundedAmount(amount: number): number {
    return Math.floor(amount / 5) * 5;
  }

  /**
   * Base point calculation: 2 points per $5 spent
   */
  calculateBasePoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 0.2);
  }

  /**
   * Determines if a transaction is eligible for bonus points
   * based on currency, total spend and statement composition
   */
  getBonusPointsEligibility(props: UOBSignatureCardProps): boolean {
    return this.foreignCurrencyRule.isEligible(props);
  }

  /**
   * Bonus point calculation: Custom logic for foreign currency transactions
   */
  calculateBonusPoints(roundedAmount: number): number {
    // Get total potential bonus points
    const potentialBonusPoints = Math.round(roundedAmount * 1.8);
    
    // Return the potential bonus points (capping will be applied later)
    return potentialBonusPoints;
  }

  /**
   * UOB Signature has a different capping mechanism,
   * but we need to implement this method to satisfy the abstract class
   */
  getBonusPointsCap() {
    // Return a dummy cap that won't be used since we override calculateRewards
    return {
      maxBonusPoints: 8000,
      applyCap: (bonus: number) => bonus,
      getRemainingBonusPoints: () => 0
    };
  }

  /**
   * Override the rewards calculation for this specific card
   * since it has different behavior than the base implementation
   */
  calculateRewards() {
    // Use a safer approach to access props with proper typing
    const props = this.props as UOBSignatureCardProps;
    const { amount, currency, nonSgdSpendTotal, hasSgdTransactions } = props;
    const roundedAmount = this.calculateRoundedAmount(amount);
    const basePoints = this.calculateBasePoints(roundedAmount);
    
    // Determine bonus eligibility and calculate
    let bonusPoints = 0;
    let bonusPointMessage = "";
    
    if (currency !== 'SGD') {
      const totalNonSgdSpend = nonSgdSpendTotal + amount;
      
      if (!hasSgdTransactions) {
        if (totalNonSgdSpend >= 1000) {
          // Calculate bonus points - already rounded to nearest $5
          bonusPoints = this.calculateBonusPoints(roundedAmount);
          bonusPointMessage = "Minimum foreign spend reached";
        } else {
          const remainingToSpend = 1000 - totalNonSgdSpend;
          const potentialPoints = Math.round((Math.floor(1000 / 5) * 5 / 5) * 18);
          bonusPointMessage = `Spend SGD ${remainingToSpend.toFixed(2)} more to earn ${potentialPoints} bonus points`;
        }
      } else {
        bonusPointMessage = "No bonus points (SGD transactions present this month)";
      }
    } else {
      bonusPointMessage = "No bonus points (SGD currency)";
    }
    
    // Apply combined cap
    const { cappedBasePoints, cappedBonusPoints } = this.pointsCap.applyCap(basePoints, bonusPoints);
    const totalPoints = cappedBasePoints + cappedBonusPoints;
    
    return {
      basePoints: cappedBasePoints,
      bonusPoints: cappedBonusPoints,
      totalPoints,
      bonusPointMessage
    };
  }
}

/**
 * Functional wrapper component for backward compatibility
 */
export const UOBSignatureCardWrapper: React.FC<UOBSignatureCardProps> = (props) => {
  return <UOBSignatureCardRefactored {...props} />;
};