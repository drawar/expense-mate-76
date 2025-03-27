import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, MonthlyCap, RewardRule, RewardRuleFactory } from './BaseRewardCard';

/**
 * Extended props interface for UOBPlatinumCard
 */
export interface UOBPlatinumCardProps extends BaseRewardCardProps {
  // Required property specific to this card
  usedBonusPoints: number;
  // Optional properties with defaults
  isContactless?: boolean;
}

/**
 * UOB Platinum Card Implementation using the OOP approach
 * 
 * This demonstrates another concrete implementation of the BaseRewardCard
 * with its specific rounding logic and eligibility rules.
 */
export class UOBPlatinumCardRefactored extends BaseRewardCard<UOBPlatinumCardProps> {
  // Define card-specific MCC code collection
  private readonly eligibleMCCs: string[] = [
    '4816', '5262', '5306', '5309', '5310', '5311', '5331', '5399', 
    '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699',
    '5732', '5733', '5734', '5735', '5912', '5942', '5944', '5945',
    '5946', '5947', '5948', '5949', '5964', '5965', '5966', '5967',
    '5968', '5969', '5970', '5992', '5999', '5811', '5812', '5814',
    '5333', '5411', '5441', '5462', '5499', '8012', '9751', '7278',
    '7832', '7841', '7922', '7991', '7996', '7998', '7999'
  ];

  // Define card-specific bonus eligibility rule
  private readonly bonusEligibilityRule: RewardRule = RewardRuleFactory.createAnyRule([
    // Rule 1: Contactless payment (regardless of MCC)
    RewardRuleFactory.createContactlessTransactionRule(),
    
    // Rule 2: Online transaction with eligible MCC
    RewardRuleFactory.createCompoundRule([
      RewardRuleFactory.createOnlineTransactionRule(),
      RewardRuleFactory.createMCCInclusionRule(this.eligibleMCCs)
    ])
  ]);

  // Implement required abstract methods

  /**
   * UOB Platinum rounds down to the nearest $5
   */
  calculateRoundedAmount(amount: number): number {
    return Math.floor(amount / 5) * 5;
  }

  /**
   * Base point calculation: 0.4 points per dollar
   */
  calculateBasePoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 0.4);
  }

  /**
   * Determines if a transaction is eligible for bonus points
   * based on contactless status or online+eligible MCC status
   */
  getBonusPointsEligibility(props: UOBPlatinumCardProps): boolean {
    return this.bonusEligibilityRule.isEligible(props);
  }

  /**
   * Bonus point calculation: 3.6 additional points per dollar
   */
  calculateBonusPoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 3.6);
  }

  /**
   * UOB Platinum has a 4000 points monthly cap on bonus points
   */
  getBonusPointsCap(): MonthlyCap {
    return new MonthlyCap(4000);
  }
}

/**
 * Functional wrapper component for backward compatibility
 */
export const UOBPlatinumCardWrapper: React.FC<UOBPlatinumCardProps> = (props) => {
  return <UOBPlatinumCardRefactored {...props} />;
};