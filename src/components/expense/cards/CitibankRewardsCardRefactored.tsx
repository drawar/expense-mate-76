import React from 'react';
import { BaseRewardCard, BaseRewardCardProps, MonthlyCap, RewardRule, RewardRuleFactory } from './BaseRewardCard';

/**
 * Extended props interface for CitibankRewardsCard
 */
export interface CitibankRewardsCardProps extends BaseRewardCardProps {
  // This card specifically requires usedBonusPoints to track the monthly cap
  usedBonusPoints: number;
}

/**
 * CitibankRewards Card Implementation using the OOP approach
 * 
 * This demonstrates how to use the BaseRewardCard to create specific card implementations
 * with their own rule sets and calculation logic.
 */
export class CitibankRewardsCardRefactored extends BaseRewardCard<CitibankRewardsCardProps> {
  // Define card-specific MCC code collections
  private readonly exclusionMCCs: string[] = [
    // Airlines (3000-3999)
    ...[...Array(1000)].map((_, i) => `${3000 + i}`),
    // Other exclusions
    '4511', '7512', '7011', '4111', '4112', '4789', '4411', '4722', '4723', '5962', '7012'
  ];
  
  private readonly inclusionMCCs: string[] = [
    '5311', '5611', '5621', '5631', '5641', '5651', '5655', '5661', '5691', '5699', '5948'
  ];

  // Define card-specific bonus eligibility rule
  private readonly bonusEligibilityRule: RewardRule = RewardRuleFactory.createAnyRule([
    // Rule 1: Online transaction that isn't from an excluded MCC
    RewardRuleFactory.createCompoundRule([
      RewardRuleFactory.createOnlineTransactionRule(),
      RewardRuleFactory.createMCCExclusionRule(this.exclusionMCCs)
    ]),
    // Rule 2: Transaction with an included MCC regardless of online status
    RewardRuleFactory.createMCCInclusionRule(this.inclusionMCCs)
  ]);

  // Implement required abstract methods

  /**
   * Rounds down to the nearest dollar for Citibank Rewards Card
   */
  calculateRoundedAmount(amount: number): number {
    return Math.floor(amount);
  }

  /**
   * Base point calculation for Citibank Rewards: 0.4 points per dollar
   */
  calculateBasePoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 0.4);
  }

  /**
   * Determines if a transaction is eligible for bonus points based on MCC and online status
   */
  getBonusPointsEligibility(props: CitibankRewardsCardProps): boolean {
    return this.bonusEligibilityRule.isEligible(props);
  }

  /**
   * Bonus point calculation for Citibank Rewards: 3.6 additional points per dollar
   */
  calculateBonusPoints(roundedAmount: number): number {
    return Math.round(roundedAmount * 3.6); 
  }

  /**
   * Citibank Rewards has a 4000 points monthly cap on bonus points
   */
  getBonusPointsCap(): MonthlyCap {
    return new MonthlyCap(4000);
  }
}

/**
 * Functional wrapper component for backward compatibility
 */
export const CitibankRewardsCardWrapper: React.FC<CitibankRewardsCardProps> = (props) => {
  return <CitibankRewardsCardRefactored {...props} />;
};