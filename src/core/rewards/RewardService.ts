import { DateTime } from 'luxon';
import { PaymentMethod } from '@/types';
import { CalculationInput, CalculationResult, RewardRule } from './types';
import { RuleRepository } from './RuleRepository';

export class RewardService {
  private ruleRepository: RuleRepository;

  constructor(ruleRepository: RuleRepository) {
    this.ruleRepository = ruleRepository;
  }

  async calculateRewards(input: CalculationInput): Promise<CalculationResult> {
    let totalPoints = 0;
    let basePoints = 0;
    let bonusPoints = 0;
    let minSpendMet = true;
    const messages: string[] = [];
    let appliedRule: RewardRule | undefined;
    let appliedTier: any;

    try {
      // 1. Find applicable rules
      const rules = await this.ruleRepository.findApplicableRules(input);

      if (!rules || rules.length === 0) {
        return {
          totalPoints: 0,
          basePoints: 0,
          bonusPoints: 0,
          pointsCurrency: input.paymentMethod.pointsCurrency || 'points',
          minSpendMet: true,
          messages: ['No applicable reward rules found'],
        };
      }

      // 2. Apply rules based on priority
      for (const rule of rules) {
        appliedRule = rule;

        // Check monthly minimum spend
        if (rule.reward.monthlyMinSpend && input.monthlySpend && input.monthlySpend < rule.reward.monthlyMinSpend) {
          minSpendMet = false;
          messages.push(`Monthly minimum spend of ${rule.reward.monthlyMinSpend} not met`);
          continue; // Skip to the next rule
        }

        // 3. Calculate base points
        switch (rule.reward.calculationMethod) {
          case 'standard':
            basePoints = this.calculateStandardPoints(input.amount, rule.reward.baseMultiplier, rule.reward.pointsRoundingStrategy, rule.reward.blockSize, rule.reward.amountRoundingStrategy);
            break;
          case 'tiered':
            const { points: tieredPoints, tier } = this.calculateTieredPoints(input.amount, rule.reward.bonusTiers, input.monthlySpend);
            bonusPoints = tieredPoints;
            appliedTier = tier;
            break;
          case 'flat_rate':
            basePoints = rule.reward.baseMultiplier;
            break;
          case 'direct':
            basePoints = input.amount;
            break;
          default:
            console.warn(`Unknown calculation method: ${rule.reward.calculationMethod}`);
            break;
        }

        // 4. Calculate bonus points
        if (rule.reward.bonusMultiplier > 0) {
          bonusPoints += this.calculateBonusPoints(input.amount, rule.reward.bonusMultiplier, rule.reward.pointsRoundingStrategy, rule.reward.blockSize, rule.reward.amountRoundingStrategy);
        }

        // 5. Apply monthly cap
        let remainingMonthlyBonusPoints: number | undefined;
        if (rule.reward.monthlyCap !== undefined) {
          const cap = rule.reward.monthlyCap;
          const usedBonusPoints = input.usedBonusPoints || 0;
          const availableBonusPoints = cap - usedBonusPoints;
          bonusPoints = Math.min(bonusPoints, availableBonusPoints);
          remainingMonthlyBonusPoints = availableBonusPoints;
          if (availableBonusPoints <= 0) {
            messages.push('Monthly bonus points cap reached');
          }
        }

        totalPoints = basePoints + bonusPoints;

        return {
          totalPoints,
          basePoints,
          bonusPoints,
          pointsCurrency: rule.reward.pointsCurrency,
          remainingMonthlyBonusPoints,
          minSpendMet,
          appliedRule,
          appliedTier,
          messages,
        };
      }

      // If no rule was successfully applied
      return {
        totalPoints: 0,
        basePoints: 0,
        bonusPoints: 0,
        pointsCurrency: input.paymentMethod.pointsCurrency || 'points',
        minSpendMet: true,
        messages: ['No applicable reward rules applied'],
      };

    } catch (error) {
      console.error('Error calculating rewards:', error);
      throw error;
    }
  }

  private calculateStandardPoints(amount: number, multiplier: number, roundingStrategy: string = 'floor', blockSize: number = 1, amountRoundingStrategy: string = 'none'): number {
    let roundedAmount = amount;

    switch (amountRoundingStrategy) {
      case 'floor':
        roundedAmount = Math.floor(amount);
        break;
      case 'ceiling':
        roundedAmount = Math.ceil(amount);
        break;
      case 'nearest':
        roundedAmount = Math.round(amount);
        break;
      case 'floor5':
        roundedAmount = Math.floor(amount / 5) * 5;
        break;
      case 'none':
      default:
        break;
    }

    let points = (roundedAmount / blockSize) * multiplier;

    switch (roundingStrategy) {
      case 'floor':
        return Math.floor(points);
      case 'ceiling':
        return Math.ceil(points);
      case 'nearest':
        return Math.round(points);
      default:
        return Math.floor(points);
    }
  }

  private calculateBonusPoints(amount: number, multiplier: number, roundingStrategy: string = 'floor', blockSize: number = 1, amountRoundingStrategy: string = 'none'): number {
    return this.calculateStandardPoints(amount, multiplier, roundingStrategy, blockSize, amountRoundingStrategy);
  }

  private calculateTieredPoints(amount: number, tiers: any[], monthlySpend?: number): { points: number, tier: any } {
    let points = 0;
    let appliedTier: any;

    if (!tiers || tiers.length === 0) {
      return { points: 0, tier: null };
    }

    // Sort tiers by priority
    tiers.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    for (const tier of tiers) {
      if (tier.minAmount !== undefined && amount < tier.minAmount) {
        continue;
      }
      if (tier.maxAmount !== undefined && amount > tier.maxAmount) {
        continue;
      }
      if (tier.minSpend !== undefined && monthlySpend !== undefined && monthlySpend < tier.minSpend) {
        continue;
      }
      if (tier.maxSpend !== undefined && monthlySpend !== undefined && monthlySpend > tier.maxSpend) {
        continue;
      }

      points = this.calculateStandardPoints(amount, tier.multiplier);
      appliedTier = tier;
      break; // Apply only the first matching tier
    }

    return { points, tier: appliedTier };
  }

  async simulateRewards(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean
  ): Promise<CalculationResult> {
    const input: CalculationInput = {
      amount,
      currency,
      paymentMethod,
      mcc,
      merchantName,
      transactionType: 'purchase',
      isOnline,
      isContactless,
      date: DateTime.now()
    };

    return this.calculateRewards(input);
  }

  // Add the missing simulatePoints method for backward compatibility
  async simulatePoints(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    mcc?: string,
    merchantName?: string,
    isOnline?: boolean,
    isContactless?: boolean
  ): Promise<CalculationResult> {
    return this.simulateRewards(amount, currency, paymentMethod, mcc, merchantName, isOnline, isContactless);
  }
}

// Create singleton instance
export const rewardService = new RewardService(new RuleRepository());
