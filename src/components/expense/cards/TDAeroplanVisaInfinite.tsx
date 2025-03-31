import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, MonthlyCap, TieredRateConfig } from './BaseRewardCard';

/**
 * Extended props interface for TDAeroplanVisaInfiniteCard
 */
export interface TDAeroplanVisaInfiniteCardProps extends BaseRewardCardProps {
  usedBonusPoints: number;
  merchantName?: string;
}

/**
 * TD Aeroplan Visa Infinite Card Implementation
 * 
 * Card features:
 * - Issuer: TD
 * - Currency: CAD
 * - Card Network: Visa
 * - Card Type: Visa Infinite
 * - Card Name: Aeroplan
 * - Earn 1.5 points for every CAD 1 spent on eligible gas, grocery (MCC-based)
 *   and direct through Air Canada purchases (merchant name-based)
 * - Earn 1 point for every CAD 1 spent on all other purchases
 * - No monthly caps
 */
export class TDAeroplanVisaInfiniteCard extends BaseRewardCard<TDAeroplanVisaInfiniteCardProps> {
  // Define eligible categories
  private readonly gasAndGroceryMCCs: string[] = [
    // Gas stations
    '5541', '5542',
    // Grocery stores
    '5411', '5422', '5441', '5451', '5462'
  ];
  
  private readonly airCanadaMerchants: string[] = [
    'Air Canada'
  ];

  /**
   * Round amount to nearest integer for Aeroplan points calculation
   */
  calculateRoundedAmount(amount: number): number {
    return Math.round(amount); // Round to nearest integer
  }

  /**
   * Base point calculation: 1 point per dollar for all transactions
   */
  calculateBasePoints(amount: number): number {
    return Math.round(amount * 1);
  }

  /**
   * Determines if a transaction is eligible for bonus points (1.5x rate)
   * based on MCC code for gas/grocery or merchant name for Air Canada
   */
  getBonusPointsEligibility(props: TDAeroplanVisaInfiniteCardProps): boolean {
    const { mcc, merchantName } = props;
    
    // Check MCC for gas and grocery
    if (mcc && this.gasAndGroceryMCCs.includes(mcc)) {
      return true;
    }
    
    // Check merchant name for Air Canada
    if (merchantName && this.airCanadaMerchants.includes(merchantName)) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculates bonus points based on the 1.5x rate
   * (bonus is 0.5x since base rate is 1x)
   */
  calculateBonusPoints(amount: number): number {
    // The bonus is (1.5 - 1.0) * amount = 0.5 * amount
    return Math.round(amount * 0.5);
  }

  /**
   * No monthly cap on points
   */
  getBonusPointsCap(): MonthlyCap {
    return new MonthlyCap(Number.MAX_SAFE_INTEGER);
  }
  
  /**
   * Override the standard calculation to implement 1.5x rates
   * and explain the applied rate
   */
  calculateRewards(): any {
    const props = this.props;
    const { amount, mcc, merchantName } = props;
    
    // Calculate base points (always 1x)
    const basePoints = this.calculateBasePoints(amount);
    
    // Determine bonus eligibility
    const isEligible = this.getBonusPointsEligibility(props);
    const bonusPoints = isEligible ? this.calculateBonusPoints(amount) : 0;
    
    // Generate message about the applied rate
    let bonusPointMessage = "";
    if (!isEligible) {
      bonusPointMessage = " (1x rate applied)";
    } else {
      // Determine which category triggered the bonus
      if (mcc && this.gasAndGroceryMCCs.includes(mcc)) {
        const category = this.gasAndGroceryMCCs.slice(0, 2).includes(mcc) ? "gas" : "grocery";
        bonusPointMessage = ` (1.5x rate applied for ${category})`;
      } else if (merchantName && this.airCanadaMerchants.includes(merchantName)) {
        bonusPointMessage = " (1.5x rate applied for Air Canada purchase)";
      } else {
        bonusPointMessage = " (1.5x rate applied)";
      }
    }
    
    // For TD Aeroplan, total points are the sum of base and bonus
    const totalPoints = basePoints + bonusPoints;
    
    return {
      basePoints,
      bonusPoints,
      totalPoints,
      bonusPointMessage,
      pointsCurrency: 'Aeroplan'
    };
  }
}

/**
 * Functional wrapper component for usage
 */
export const TDAeroplanVisaInfiniteCardWrapper: React.FC<TDAeroplanVisaInfiniteCardProps> = (props) => {
  return <TDAeroplanVisaInfiniteCard {...props} />;
};