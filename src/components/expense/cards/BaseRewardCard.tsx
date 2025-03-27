import React, { Component } from 'react';

// Base interface for all reward card props
export interface BaseRewardCardProps {
  amount: number;
  mcc?: string;
  isOnline?: boolean;
  isContactless?: boolean;
  currency?: string;
  usedBonusPoints?: number;
  
  // New properties for advanced card configurations
  merchantName?: string;                        // For merchant name-based rules (Amex)
  monthlySpendByCategory?: Record<string, number>; // Track spending by category
  selectedCategories?: string[];                // For UOB Lady's category selection
  monthTotalEligibleSpend?: number;             // For month-level calculations
  statementCycle?: Date;                        // For resetting monthly calculations
  pointsCurrency?: string;                      // Type of points earned (UOB, Citi, MR, etc.)
}

// Interface for reward calculation results
export interface RewardCalculation {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  remainingBonusPoints?: number;
  bonusPointMessage?: string;
  pointsCurrency?: string;                      // Currency for displayed points
}

// Interface for reward eligibility rules
export interface RewardRule {
  isEligible(props: BaseRewardCardProps): boolean;
  calculatePoints(props: BaseRewardCardProps): number;
}

// Interface for tiered rewards configuration
export interface TieredRateConfig {
  category: string;
  rate: number;
  mccList?: string[];
  merchantNames?: string[];
  monthlyCap?: number;
  rateAfterCap?: number;
}

// Interface for bonus point caps
export interface BonusPointsCap {
  maxBonusPoints: number;
  applyCap(calculatedBonus: number, usedBonusPoints: number): number;
  getRemainingBonusPoints(usedBonusPoints: number, newBonusPoints: number): number;
}

// Standard monthly cap implementation
export class MonthlyCap implements BonusPointsCap {
  constructor(public maxBonusPoints: number) {}

  applyCap(calculatedBonus: number, usedBonusPoints: number): number {
    return Math.min(calculatedBonus, this.maxBonusPoints - (usedBonusPoints || 0));
  }

  getRemainingBonusPoints(usedBonusPoints: number, newBonusPoints: number): number {
    return Math.max(0, this.maxBonusPoints - (usedBonusPoints || 0) - newBonusPoints);
  }
}

// Base abstract class for reward cards
export abstract class BaseRewardCard<P extends BaseRewardCardProps> extends Component<P> {
  // Abstract methods that must be implemented by subclasses
  abstract calculateRoundedAmount(amount: number): number;
  abstract calculateBasePoints(roundedAmount: number): number;
  abstract getBonusPointsEligibility(props: P): boolean;
  abstract calculateBonusPoints(roundedAmount: number): number;
  abstract getBonusPointsCap(): BonusPointsCap;

  // Calculate all reward details
  calculateRewards(): RewardCalculation {
    // Use proper typing for accessing props in TypeScript
    const props = this.props as P;
    const { amount, usedBonusPoints = 0 } = props;
    const roundedAmount = this.calculateRoundedAmount(amount);
    const basePoints = this.calculateBasePoints(roundedAmount);
    
    const isEligible = this.getBonusPointsEligibility(props);
    const potentialBonusPoints = isEligible ? this.calculateBonusPoints(roundedAmount) : 0;
    
    const bonusPointsCap = this.getBonusPointsCap();
    const actualBonusPoints = bonusPointsCap.applyCap(potentialBonusPoints, usedBonusPoints);
    
    const remainingBonusPoints = bonusPointsCap.getRemainingBonusPoints(
      usedBonusPoints,
      actualBonusPoints
    );

    // Generate bonus point message if eligible but capped
    let bonusPointMessage = "";
    if (potentialBonusPoints > 0 && actualBonusPoints === 0) {
      bonusPointMessage = " (Monthly cap reached)";
    }

    return {
      basePoints,
      bonusPoints: actualBonusPoints,
      totalPoints: basePoints + actualBonusPoints,
      remainingBonusPoints,
      bonusPointMessage
    };
  }

  // Standard render method
  render() {
    const rewards = this.calculateRewards();
    
    return (
      <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 space-y-2">
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Base Points: {rewards.basePoints}
        </p>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Bonus Points: {rewards.bonusPoints}
          {rewards.bonusPointMessage}
        </p>
        <p className="text-sm text-blue-500 dark:text-blue-300">
          Total Points: {rewards.totalPoints}
        </p>
        {rewards.remainingBonusPoints !== undefined && (
          <p className="text-xs text-green-500">
            Remaining bonus points available this month: {rewards.remainingBonusPoints}
          </p>
        )}
      </div>
    );
  }
}

// Factory for creating common rule types
export class RewardRuleFactory {
  // Create a rule based on a list of included MCCs
  static createMCCInclusionRule(includedMCCs: string[]): RewardRule {
    return {
      isEligible: (props) => props.mcc !== undefined && includedMCCs.includes(props.mcc),
      calculatePoints: () => 0 // Calculation done elsewhere
    };
  }

  // Create a rule based on a list of excluded MCCs
  static createMCCExclusionRule(excludedMCCs: string[]): RewardRule {
    return {
      isEligible: (props) => props.mcc === undefined || !excludedMCCs.includes(props.mcc),
      calculatePoints: () => 0 // Calculation done elsewhere
    };
  }

  // Create a rule for online transactions
  static createOnlineTransactionRule(): RewardRule {
    return {
      isEligible: (props) => props.isOnline === true,
      calculatePoints: () => 0 // Calculation done elsewhere
    };
  }

  // Create a rule for contactless transactions
  static createContactlessTransactionRule(): RewardRule {
    return {
      isEligible: (props) => props.isContactless === true,
      calculatePoints: () => 0 // Calculation done elsewhere
    };
  }
  
  // Create a compound rule (AND logic)
  static createCompoundRule(rules: RewardRule[]): RewardRule {
    return {
      isEligible: (props) => rules.every(rule => rule.isEligible(props)),
      calculatePoints: (props) => {
        // Use the first valid calculation if all rules are eligible
        if (rules.every(rule => rule.isEligible(props))) {
          const calculatedPoints = rules.map(rule => rule.calculatePoints(props));
          return Math.max(...calculatedPoints);
        }
        return 0;
      }
    };
  }
  
  // Create a compound rule (OR logic)
  static createAnyRule(rules: RewardRule[]): RewardRule {
    return {
      isEligible: (props) => rules.some(rule => rule.isEligible(props)),
      calculatePoints: (props) => {
        // Find the first eligible rule and use its calculation
        const eligibleRule = rules.find(rule => rule.isEligible(props));
        return eligibleRule ? eligibleRule.calculatePoints(props) : 0;
      }
    };
  }

  // Create a category selection rule (for UOB Lady's)
  static createCategorySelectionRule(
    categoriesByMCC: Record<string, string[]>, 
    selectedCategories: string[]
  ): RewardRule {
    return {
      isEligible: (props) => {
        if (!props.mcc) return false;
        
        // Check if transaction MCC falls into any selected category
        for (const category of selectedCategories) {
          const categoryMCCs = categoriesByMCC[category] || [];
          if (categoryMCCs.includes(props.mcc)) {
            return true;
          }
        }
        return false;
      },
      calculatePoints: () => 0 // Calculation done elsewhere
    };
  }

  // Create a merchant name rule (for Amex Cobalt)
  static createMerchantNameRule(includedMerchantNames: string[]): RewardRule {
    return {
      isEligible: (props) => props.merchantName !== undefined && 
                           includedMerchantNames.includes(props.merchantName),
      calculatePoints: () => 0 // Calculation done elsewhere
    };
  }

  // Create a tiered reward rule (for Amex Cobalt)
  static createTieredRewardRule(tiers: TieredRateConfig[]): RewardRule {
    return {
      isEligible: (props) => {
        // Check eligibility for any tier
        return tiers.some(tier => {
          if (tier.mccList && props.mcc) {
            return tier.mccList.includes(props.mcc);
          }
          if (tier.merchantNames && props.merchantName) {
            return tier.merchantNames.includes(props.merchantName);
          }
          return false;
        });
      },
      calculatePoints: (props) => {
        // Find applicable tier
        const applicableTier = tiers.find(tier => {
          if (tier.mccList && props.mcc) {
            return tier.mccList.includes(props.mcc);
          }
          if (tier.merchantNames && props.merchantName) {
            return tier.merchantNames.includes(props.merchantName);
          }
          return false;
        });
        
        if (!applicableTier) return 0;
        
        // Check if we're over the monthly cap for this tier
        if (applicableTier.monthlyCap && props.monthlySpendByCategory) {
          const categorySpend = props.monthlySpendByCategory[applicableTier.category] || 0;
          
          if (categorySpend >= applicableTier.monthlyCap) {
            // Use the after-cap rate if available
            return props.amount * (applicableTier.rateAfterCap || 0);
          }
          
          // Calculate how much of this transaction fits under the cap
          const remainingBeforeCap = Math.max(0, applicableTier.monthlyCap - categorySpend);
          const amountUnderCap = Math.min(props.amount, remainingBeforeCap);
          const amountOverCap = Math.max(0, props.amount - amountUnderCap);
          
          // Apply different rates to portions
          return (amountUnderCap * applicableTier.rate) + 
                 (amountOverCap * (applicableTier.rateAfterCap || 0));
        }
        
        // No cap or not tracking category spend
        return props.amount * applicableTier.rate;
      }
    };
  }
}