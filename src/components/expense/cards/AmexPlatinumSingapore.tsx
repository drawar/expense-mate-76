
import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, MonthlyCap } from './BaseRewardCard';

/**
 * Extended props interface for AmexPlatinumSGCard
 */
export interface AmexPlatinumSGCardProps extends BaseRewardCardProps {
  usedBonusPoints: number;
}

/**
 * American Express Platinum Card (Singapore) Implementation
 * 
 * Card features:
 * - SGD denominated
 * - Every $1.60 spent in SGD earns 2 MR points
 * - Points are rounded to the nearest whole point
 * - No monthly cap
 * - No bonus categories
 */
export class AmexPlatinumSGCard extends BaseRewardCard<AmexPlatinumSGCardProps> {
  constructor(props: AmexPlatinumSGCardProps) {
    super(props);
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
    
    // For Amex, points are rounded to the nearest whole point
    const totalPoints = basePoints;
    
    return {
      basePoints,
      bonusPoints,
      totalPoints,
      bonusPointMessage: ` ($${(amount / basePoints * 2 / 2).toFixed(2)} per point)`,
      pointsCurrency: 'MR (Charge Card)'
    };
  }
}

/**
 * Component wrapper for the AmexPlatinumSGCard
 */
export const AmexPlatinumSGWrapper: React.FC<AmexPlatinumSGCardProps> = (props) => {
  return <AmexPlatinumSGCard {...props} />;
};
