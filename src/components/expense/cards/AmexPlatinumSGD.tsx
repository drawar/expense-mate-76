import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, MonthlyCap } from './BaseRewardCard';

/**
 * Extended props interface for AmexPlatinumSGDCard
 */
export interface AmexPlatinumSGDCardProps extends BaseRewardCardProps {
  usedBonusPoints: number;
}

/**
 * American Express Platinum Credit Card & Platinum Card Singapore Implementation
 * 
 * Card features:
 * - SGD denominated
 * - Every $1.60 spent in SGD earns 2 MR points
 * - Points are rounded to the nearest whole point
 * - No monthly cap
 * - No bonus categories
 */
export class AmexPlatinumSGDCard extends BaseRewardCard<AmexPlatinumSGDCardProps> {
  // Define if this is a credit card or charge card version
  private readonly isChargeCard: boolean;

  constructor(props: AmexPlatinumSGDCardProps) {
    super(props);
    // Determine which card type this instance represents 
    // (set in the parent component when creating the card)
    this.isChargeCard = props.pointsCurrency === 'MR (Charge Card)';
  }

  /**
   * No rounding applied to transaction amount
   */
  calculateRoundedAmount(amount: number): number {
    return amount; // No rounding on amount
  }

  /**
   * Base point calculation: $1.60 = 2 MR points
   */
  calculateBasePoints(amount: number): number {
    // Calculate points based on $1.60 = 2 MR points rate
    const points = (amount / 1.6) * 2;
    // Round to nearest whole point
    return Math.round(points);
  }

  /**
   * No bonus eligibility - all transactions earn at same rate
   */
  getBonusPointsEligibility(): boolean {
    return false; // No bonus categories
  }

  /**
   * No bonus points for this card
   */
  calculateBonusPoints(): number {
    return 0;
  }

  /**
   * No monthly cap on points
   */
  getBonusPointsCap(): MonthlyCap {
    return new MonthlyCap(Number.MAX_SAFE_INTEGER);
  }
  
  /**
   * Override the standard calculation for custom behavior
   */
  calculateRewards(): any {
    const props = this.props;
    const { amount } = props;
    
    // Calculate base points
    const basePoints = this.calculateBasePoints(amount);
    
    // No bonus points for this card
    const bonusPoints = 0;
    
    // Determine type of MR points based on card type
    const pointsCurrency = this.isChargeCard 
      ? 'MR (Charge Card)' 
      : 'MR (Credit Card)';
    
    // For Amex, points are rounded to the nearest whole point
    const totalPoints = basePoints;
    
    return {
      basePoints,
      bonusPoints,
      totalPoints,
      bonusPointMessage: ` ($${(amount / basePoints * 2 / 2).toFixed(2)} per point)`,
      pointsCurrency
    };
  }
}

/**
 * American Express Platinum Credit Card
 */
export const AmexPlatinumCreditCard: React.FC<AmexPlatinumSGDCardProps> = (props) => {
  return <AmexPlatinumSGDCard {...props} />;
};

/**
 * American Express Platinum Card (Singapore)
 */
export const AmexPlatinumSGCard: React.FC<AmexPlatinumSGDCardProps> = (props) => {
  return <AmexPlatinumSGDCard {...props} />;
};