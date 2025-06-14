import { 
  RewardRule, 
  CalculationInput, 
  CalculationResult, 
  TransactionType 
} from './types';
import { RuleRepository } from './RuleRepository';
import { DateTime } from 'luxon';

/**
 * Service for calculating reward points based on rules and transaction data
 */
export class RewardService {
  private ruleRepository: RuleRepository;

  constructor() {
    this.ruleRepository = RuleRepository.getInstance();
  }

  /**
   * Calculate reward points for a transaction
   */
  async calculateRewards(input: CalculationInput): Promise<CalculationResult> {
    const cardTypeId = input.paymentMethod?.type?.toLowerCase() || 'generic';
    
    // Get rules for this card type
    const rules = await this.ruleRepository.getRulesForCardType(cardTypeId);
    
    if (rules.length === 0) {
      return {
        totalPoints: 0,
        basePoints: 0,
        bonusPoints: 0,
        pointsCurrency: 'points',
        minSpendMet: false,
        messages: ['No reward rules found for this card type']
      };
    }

    // Sort rules by priority (higher priority first)
    const sortedRules = rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Find the first matching rule
    for (const rule of sortedRules) {
      if (this.ruleMatches(rule, input)) {
        return this.calculateRewardForRule(rule, input);
      }
    }

    // No matching rule found
    return {
      totalPoints: 0,
      basePoints: 0,
      bonusPoints: 0,
      pointsCurrency: 'points',
      minSpendMet: false,
      messages: ['No matching reward rules found']
    };
  }

  /**
   * Simulate reward points for a transaction (used in UI)
   */
  async simulateRewards(
    amount: number,
    currency: string,
    paymentMethod: any,
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
      transactionType: 'purchase' as TransactionType,
      isOnline,
      isContactless,
      date: DateTime.now()
    };
    
    return this.calculateRewards(input);
  }

  /**
   * Get points currency for a payment method
   */
  getPointsCurrency(paymentMethod: any): string {
    // Default implementation - can be enhanced based on payment method type
    return paymentMethod?.pointsCurrency || 'points';
  }

  /**
   * Check if a rule matches the transaction
   */
  private ruleMatches(rule: RewardRule, input: CalculationInput): boolean {
    if (!rule.enabled) return false;

    // Check all conditions
    for (const condition of rule.conditions) {
      if (!this.conditionMatches(condition, input)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a condition matches the transaction
   */
  private conditionMatches(condition: any, input: CalculationInput): boolean {
    switch (condition.type) {
      case 'mcc':
        if (!input.mcc) return false;
        if (condition.operation === 'include') {
          return condition.values?.includes(input.mcc) || false;
        } else if (condition.operation === 'exclude') {
          return !condition.values?.includes(input.mcc) || true;
        }
        break;

      case 'transaction_type':
        if (condition.operation === 'equals') {
          return condition.values?.includes(input.transactionType) || false;
        }
        break;

      case 'currency':
        if (condition.operation === 'include') {
          return condition.values?.includes(input.currency) || false;
        } else if (condition.operation === 'exclude') {
          return !condition.values?.includes(input.currency) || true;
        }
        break;

      case 'merchant':
        if (!input.merchantName) return false;
        if (condition.operation === 'include') {
          return condition.values?.some(merchant => 
            input.merchantName.toLowerCase().includes(merchant.toLowerCase())
          ) || false;
        }
        break;
    }

    return true;
  }

  /**
   * Calculate rewards for a specific rule
   */
  private calculateRewardForRule(rule: RewardRule, input: CalculationInput): CalculationResult {
    const reward = rule.reward;
    const result: CalculationResult = {
      totalPoints: 0,
      basePoints: 0,
      bonusPoints: 0,
      pointsCurrency: reward.pointsCurrency,
      minSpendMet: true,
      appliedRule: rule,
      messages: []
    };

    // Apply amount rounding first
    let effectiveAmount = input.amount;
    switch (reward.amountRoundingStrategy) {
      case 'floor':
        effectiveAmount = Math.floor(effectiveAmount);
        break;
      case 'ceiling':
        effectiveAmount = Math.ceil(effectiveAmount);
        break;
      case 'floor5':
        effectiveAmount = Math.floor(effectiveAmount / 5) * 5;
        break;
      case 'nearest':
        effectiveAmount = Math.round(effectiveAmount);
        break;
    }

    // Calculate base points
    const baseMultiplier = reward.baseMultiplier || 1;
    let basePoints = 0;

    if (reward.calculationMethod === 'standard') {
      basePoints = Math.floor(effectiveAmount / reward.blockSize) * baseMultiplier;
    } else {
      basePoints = (effectiveAmount * baseMultiplier) / reward.blockSize;
    }

    result.basePoints = this.applyPointsRounding(basePoints, reward.pointsRoundingStrategy);

    // Check minimum spend requirement
    const monthlySpend = input.monthlySpend || 0;
    const minSpendRequired = reward.monthlyMinSpend || 0;
    result.minSpendMet = monthlySpend >= minSpendRequired;

    // Calculate bonus points if minimum spend is met
    if (result.minSpendMet && reward.bonusMultiplier && reward.bonusMultiplier > 0) {
      let bonusPoints = 0;
      
      if (reward.calculationMethod === 'standard') {
        bonusPoints = Math.floor(effectiveAmount / reward.blockSize) * reward.bonusMultiplier;
      } else {
        bonusPoints = (effectiveAmount * reward.bonusMultiplier) / reward.blockSize;
      }

      result.bonusPoints = this.applyPointsRounding(bonusPoints, reward.pointsRoundingStrategy);
    }

    // Apply monthly cap if specified
    if (reward.monthlyCap && result.bonusPoints > 0) {
      const usedBonusPoints = input.usedBonusPoints || 0;
      const remainingCap = Math.max(0, reward.monthlyCap - usedBonusPoints);
      
      if (result.bonusPoints > remainingCap) {
        result.bonusPoints = remainingCap;
        result.messages.push(`Bonus points capped at ${remainingCap} due to monthly limit`);
      }
      
      result.remainingMonthlyBonusPoints = remainingCap - result.bonusPoints;
    }

    result.totalPoints = result.basePoints + result.bonusPoints;

    return result;
  }

  /**
   * Apply points rounding strategy
   */
  private applyPointsRounding(points: number, strategy: string): number {
    switch (strategy) {
      case 'floor':
        return Math.floor(points);
      case 'ceiling':
        return Math.ceil(points);
      case 'nearest':
        return Math.round(points);
      default:
        return points;
    }
  }
}

// Export singleton instance
export const rewardService = new RewardService();
