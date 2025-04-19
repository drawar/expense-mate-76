// services/rewards/RuleEngine.ts

import { 
  CalculationInput, 
  CalculationResult, 
  RewardRule, 
  RuleCondition,
  RoundingStrategy,
  TransactionType,
  BonusTier
} from './types';

/**
 * Engine for evaluating reward rules and calculating points
 */
export class RuleEngine {
  /**
   * Calculate reward points for a given input based on rules
   */
  public calculateRewards(input: CalculationInput, rules: RewardRule[]): CalculationResult {
    // Filter for enabled rules only and sort by priority (highest first)
    const applicableRules = rules
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority)
      .filter(rule => this.evaluateConditions(rule.conditions, input));
    
    // If no rules apply, return default calculation
    if (applicableRules.length === 0) {
      return this.createDefaultResult(input);
    }
    
    // Use the highest priority matching rule
    const rule = applicableRules[0];
    
    // Check if minimum monthly spend threshold is met
    const minSpendMet = this.isMinimumSpendMet(rule, input);
    
    // Find the applicable bonus tier if any exist
    const appliedTier = this.findApplicableTier(rule, input, minSpendMet);
    
    // Get effective multiplier based on tier or default rule
    const effectiveMultiplier = appliedTier?.multiplier ?? rule.reward.bonusMultiplier;
    
    // Calculate points based on rule's calculation method
    const { basePoints, bonusPoints } = this.calculatePoints(
      rule, 
      input.amount, 
      effectiveMultiplier, 
      minSpendMet
    );
    
    // Apply monthly cap if specified
    const { actualBonusPoints, remainingMonthlyBonusPoints } = this.applyMonthlyCap(
      bonusPoints,
      rule,
      input.usedBonusPoints || 0,
      minSpendMet
    );
    
    // Create result messages
    const messages = this.createResultMessages(rule, minSpendMet, bonusPoints, actualBonusPoints, appliedTier);
    
    // Return the result
    return {
      totalPoints: basePoints + actualBonusPoints,
      basePoints,
      bonusPoints: actualBonusPoints,
      pointsCurrency: rule.reward.pointsCurrency,
      remainingMonthlyBonusPoints,
      minSpendMet,
      appliedRule: rule,
      appliedTier,
      messages
    };
  }
  
  /**
   * Create default result when no rules apply
   */
  private createDefaultResult(input: CalculationInput): CalculationResult {
    const basePoints = Math.round(input.amount);
    return {
      totalPoints: basePoints,
      basePoints,
      bonusPoints: 0,
      pointsCurrency: input.paymentMethod.issuer ? `${input.paymentMethod.issuer} Points` : 'Points',
      minSpendMet: false,
      messages: ['No specific reward rules applied']
    };
  }
  
  /**
   * Find applicable tier for a rule
   */
  private findApplicableTier(
    rule: RewardRule, 
    input: CalculationInput, 
    minSpendMet: boolean
  ): BonusTier | undefined {
    if (!rule.reward.bonusTiers || rule.reward.bonusTiers.length === 0 || !minSpendMet) {
      return undefined;
    }
    
    // Filter tiers that match the input and sort by priority
    const matchingTiers = rule.reward.bonusTiers
      .filter(tier => this.evaluateCondition(tier.condition, input))
      .sort((a, b) => b.priority - a.priority);
    
    // Return highest priority tier or undefined if none match
    return matchingTiers.length > 0 ? matchingTiers[0] : undefined;
  }
  
  /**
   * Calculate base and bonus points
   */
  private calculatePoints(
    rule: RewardRule,
    amount: number,
    effectiveMultiplier: number,
    minSpendMet: boolean
  ): { basePoints: number; bonusPoints: number } {
    if (rule.reward.calculationMethod === 'standard') {
      return this.calculatePointsStandard(rule, amount, effectiveMultiplier, minSpendMet);
    } else {
      return this.calculatePointsDirect(rule, amount, effectiveMultiplier, minSpendMet);
    }
  }
  
  /**
   * Calculate points using standard method:
   * 1. Round amount according to strategy
   * 2. Divide by block size
   * 3. Multiply by rates
   */
  private calculatePointsStandard(
    rule: RewardRule,
    amount: number,
    effectiveMultiplier: number,
    minSpendMet: boolean
  ): { basePoints: number; bonusPoints: number } {
    // Round amount according to strategy
    const roundedAmount = this.applyRounding(
      amount, 
      rule.reward.amountRoundingStrategy
    );
    
    // Calculate points per block
    const pointsPerBlock = roundedAmount / rule.reward.blockSize;
    
    // Apply base rate
    const basePoints = this.applyRounding(
      pointsPerBlock * rule.reward.baseMultiplier, 
      rule.reward.pointsRoundingStrategy
    );
    
    // Only apply bonus rate if minimum spend threshold is met
    const bonusPoints = minSpendMet ? 
      this.applyRounding(
        pointsPerBlock * effectiveMultiplier,
        rule.reward.pointsRoundingStrategy
      ) : 0;
    
    return { basePoints, bonusPoints };
  }
  
  /**
   * Calculate points using direct method:
   * 1. Multiply amount by total rate (base + bonus multiplier)
   * 2. Round the result
   */
  private calculatePointsDirect(
    rule: RewardRule,
    amount: number,
    effectiveMultiplier: number,
    minSpendMet: boolean
  ): { basePoints: number; bonusPoints: number } {
    // Base points calculation
    const basePoints = this.applyRounding(
      amount * rule.reward.baseMultiplier,
      rule.reward.pointsRoundingStrategy
    );
    
    // Only apply bonus if minimum spend threshold is met
    let bonusPoints = 0;
    
    if (minSpendMet) {
      // Calculate total points with multiplier
      const totalPoints = this.applyRounding(
        amount * (rule.reward.baseMultiplier + effectiveMultiplier),
        rule.reward.pointsRoundingStrategy
      );
      
      // Bonus is the difference between total and base
      bonusPoints = totalPoints - basePoints;
    }
    
    return { basePoints, bonusPoints };
  }
  
  /**
   * Apply monthly cap to bonus points
   */
  private applyMonthlyCap(
    bonusPoints: number,
    rule: RewardRule,
    usedBonusPoints: number,
    minSpendMet: boolean
  ): { actualBonusPoints: number; remainingMonthlyBonusPoints?: number } {
    // If no cap or spend threshold not met, return original bonus points
    if (!rule.reward.monthlyCap || rule.reward.monthlyCap <= 0 || !minSpendMet) {
      return { actualBonusPoints: bonusPoints };
    }
    
    // Check if already reached the cap
    if (usedBonusPoints >= rule.reward.monthlyCap) {
      return { 
        actualBonusPoints: 0,
        remainingMonthlyBonusPoints: 0
      };
    }
    
    // Check if this would exceed the cap
    const remainingCap = rule.reward.monthlyCap - usedBonusPoints;
    if (bonusPoints > remainingCap) {
      return {
        actualBonusPoints: remainingCap,
        remainingMonthlyBonusPoints: 0
      };
    }
    
    return {
      actualBonusPoints: bonusPoints,
      remainingMonthlyBonusPoints: remainingCap - bonusPoints
    };
  }
  
  /**
   * Create result messages
   */
  private createResultMessages(
    rule: RewardRule,
    minSpendMet: boolean,
    bonusPoints: number,
    actualBonusPoints: number,
    appliedTier?: BonusTier
  ): string[] {
    const messages: string[] = [];
    
    if (!minSpendMet && rule.reward.monthlyMinSpend) {
      messages.push(`Minimum monthly spend of ${rule.reward.monthlyMinSpend} not met for bonus points`);
    } else if (bonusPoints > 0 && actualBonusPoints === 0) {
      messages.push('Monthly bonus points cap reached');
    } else if (appliedTier) {
      messages.push(`Applied tier: ${appliedTier.name} (${appliedTier.multiplier}x)`);
    } else if (rule.description) {
      messages.push(`Applied rule: ${rule.description}`);
    }
    
    return messages;
  }
  
  /**
   * Check if minimum monthly spend threshold is met
   */
  private isMinimumSpendMet(rule: RewardRule, input: CalculationInput): boolean {
    // If no minimum spend requirement, always return true
    if (!rule.reward.monthlyMinSpend || rule.reward.monthlyMinSpend <= 0) {
      return true;
    }
    
    // If monthly spend data is not provided, assume threshold is not met
    if (input.monthlySpend === undefined) {
      return false;
    }
    
    // Check if spend meets or exceeds threshold
    return input.monthlySpend >= rule.reward.monthlyMinSpend;
  }
  
  /**
   * Evaluate if all conditions in a rule apply to the input
   */
  private evaluateConditions(conditions: RuleCondition[], input: CalculationInput): boolean {
    // If no conditions, the rule applies
    if (!conditions || conditions.length === 0) {
      return true;
    }
    
    // All conditions must be satisfied (AND logic)
    return conditions.every(condition => this.evaluateCondition(condition, input));
  }
  
  /**
   * Evaluate a single condition
   */
  public evaluateCondition(condition: RuleCondition, input: CalculationInput): boolean {
    // Handle compound conditions
    if (condition.type === 'compound') {
      if (!condition.subConditions || condition.subConditions.length === 0) {
        return true;
      }
      
      if (condition.operation === 'all') {
        // AND logic - all must be true
        return condition.subConditions.every(subCondition => 
          this.evaluateCondition(subCondition, input)
        );
      } else if (condition.operation === 'any') {
        // OR logic - any can be true
        return condition.subConditions.some(subCondition => 
          this.evaluateCondition(subCondition, input)
        );
      }
      
      return false;
    }
    
    // Delegate to specific condition evaluators
    const evaluators: Record<string, (condition: RuleCondition, input: CalculationInput) => boolean> = {
      'mcc': this.evaluateMccCondition,
      'merchant': this.evaluateMerchantCondition,
      'transaction_type': this.evaluateTransactionTypeCondition,
      'currency': this.evaluateCurrencyCondition,
      'amount': this.evaluateAmountCondition,
      'date': this.evaluateDateCondition,
      'category': this.evaluateCategoryCondition,
      'spend_threshold': this.evaluateSpendThresholdCondition
    };
    
    const evaluator = evaluators[condition.type];
    return evaluator ? evaluator.call(this, condition, input) : false;
  }
  
  /**
   * Evaluate MCC code condition
   */
  private evaluateMccCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!input.mcc || !condition.values) {
      return false;
    }
    
    if (condition.operation === 'include') {
      return (condition.values as string[]).includes(input.mcc);
    } else if (condition.operation === 'exclude') {
      return !(condition.values as string[]).includes(input.mcc);
    }
    
    return false;
  }
  
  /**
   * Evaluate merchant name condition
   */
  private evaluateMerchantCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!input.merchantName || !condition.values) {
      return false;
    }
    
    const merchantNameLower = input.merchantName.toLowerCase();
    
    if (condition.operation === 'include') {
      return (condition.values as string[]).some(name => 
        merchantNameLower.includes(name.toLowerCase())
      );
    } else if (condition.operation === 'exclude') {
      return !(condition.values as string[]).some(name => 
        merchantNameLower.includes(name.toLowerCase())
      );
    } else if (condition.operation === 'equals') {
      return (condition.values as string[]).some(name => 
        merchantNameLower === name.toLowerCase()
      );
    }
    
    return false;
  }
  
  /**
   * Evaluate transaction type condition (online/contactless/in-store)
   */
  private evaluateTransactionTypeCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values) {
      return false;
    }
    
    if (condition.operation === 'equals') {
      return (condition.values as TransactionType[]).includes(input.transactionType);
    } else if (condition.operation === 'not_equals') {
      return !(condition.values as TransactionType[]).includes(input.transactionType);
    }
    
    return false;
  }
  
  /**
   * Evaluate currency condition
   */
  private evaluateCurrencyCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values) {
      return false;
    }
    
    if (condition.operation === 'include') {
      return (condition.values as string[]).includes(input.currency);
    } else if (condition.operation === 'exclude') {
      return !(condition.values as string[]).includes(input.currency);
    } else if (condition.operation === 'equals') {
      return input.currency === condition.values[0];
    } else if (condition.operation === 'not_equals') {
      return input.currency !== condition.values[0];
    }
    
    return false;
  }
  
  /**
   * Evaluate amount condition
   */
  private evaluateAmountCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values) {
      return false;
    }
    
    const amount = input.amount;
    
    if (condition.operation === 'greater_than') {
      return amount > (condition.values[0] as number);
    } else if (condition.operation === 'less_than') {
      return amount < (condition.values[0] as number);
    } else if (condition.operation === 'between') {
      return amount >= (condition.values[0] as number) && 
             amount <= (condition.values[1] as number);
    } else if (condition.operation === 'equals') {
      return amount === (condition.values[0] as number);
    }
    
    return false;
  }
  
  /**
   * Evaluate date condition
   */
  private evaluateDateCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values || !input.date) {
      return false;
    }
    
    // Implementation depends on your specific date condition format
    return true;
  }
  
  /**
   * Evaluate category condition
   */
  private evaluateCategoryCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!input.category || !condition.values) {
      return false;
    }
    
    if (condition.operation === 'include') {
      return (condition.values as string[]).includes(input.category);
    } else if (condition.operation === 'exclude') {
      return !(condition.values as string[]).includes(input.category);
    } else if (condition.operation === 'equals') {
      return input.category === condition.values[0];
    }
    
    return false;
  }
  
  /**
   * Evaluate spend threshold condition
   */
  private evaluateSpendThresholdCondition(condition: RuleCondition, input: CalculationInput): boolean {
    if (!condition.values || input.monthlySpend === undefined) {
      return false;
    }
    
    const monthlySpend = input.monthlySpend;
    
    if (condition.operation === 'greater_than') {
      return monthlySpend > (condition.values[0] as number);
    } else if (condition.operation === 'less_than') {
      return monthlySpend < (condition.values[0] as number);
    } else if (condition.operation === 'between') {
      return monthlySpend >= (condition.values[0] as number) && 
             monthlySpend <= (condition.values[1] as number);
    } else if (condition.operation === 'equals') {
      return monthlySpend === (condition.values[0] as number);
    }
    
    return false;
  }
  
  /**
   * Apply rounding strategy to a number
   */
  private applyRounding(value: number, strategy: RoundingStrategy): number {
    switch (strategy) {
      case 'floor':
        return Math.floor(value);
      
      case 'ceiling':
        return Math.ceil(value);
      
      case 'nearest':
        return Math.round(value);
      
      case 'floor5':
        return Math.floor(value / 5) * 5;
      
      case 'none':
      default:
        return value;
    }
  }
}
