// services/rewards/RuleEngine.ts

import { 
  CalculationInput, 
  CalculationResult, 
  RewardRule, 
  RuleCondition,
  RoundingStrategy,
  TransactionType,
  SpendingPeriodType,
  BonusTier
} from './types';

export class RuleEngine {
  /**
   * Calculate reward points for a given input based on rules
   */
  public calculateRewards(input: CalculationInput, rules: RewardRule[]): CalculationResult {
    // Filter for enabled rules only
    const enabledRules = rules.filter(rule => rule.enabled);
    
    // Sort by priority (highest first)
    enabledRules.sort((a, b) => b.priority - a.priority);
    
    // Find applicable rules
    const applicableRules = enabledRules.filter(rule => 
      this.evaluateConditions(rule.conditions, input)
    );
    
    // If no rules apply, return default calculation
    if (applicableRules.length === 0) {
      return {
        totalPoints: Math.round(input.amount),
        basePoints: Math.round(input.amount),
        bonusPoints: 0,
        pointsCurrency: input.paymentMethod.issuer ? `${input.paymentMethod.issuer} Points` : 'Points',
        minSpendMet: false,
        messages: ['No specific reward rules applied']
      };
    }
    
    // Use the highest priority matching rule
    const rule = applicableRules[0];
    
    // Check if minimum monthly spend threshold is met
    const minSpendMet = this.isMinimumSpendMet(rule, input);
    
    // Find the applicable bonus tier if any exist
    let appliedTier: BonusTier | undefined;
    let effectiveMultiplier = rule.reward.bonusMultiplier;

    if (rule.reward.bonusTiers && rule.reward.bonusTiers.length > 0 && minSpendMet) {
      // Filter tiers that match the input
      const matchingTiers = rule.reward.bonusTiers
        .filter(tier => {
          // Check if the tier has a compound condition
          if (tier.condition.type === 'compound') {
            return this.evaluateCondition(tier.condition, input);
          } else {
            // Single condition
            return this.evaluateCondition(tier.condition, input);
          }
        })
        .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
      
      // If we have a matching tier, use its multiplier
      if (matchingTiers.length > 0) {
        appliedTier = matchingTiers[0];
        effectiveMultiplier = appliedTier.multiplier;
      }
    }
    
    // Calculate points based on rule's calculation method
    let basePoints: number, bonusPoints: number;
    
    if (rule.reward.calculationMethod === 'standard') {
      // Standard method:
      // 1. Round amount according to strategy
      // 2. Divide by block size
      // 3. Multiply by rates
      const roundedAmount = this.applyRounding(
        input.amount, 
        rule.reward.amountRoundingStrategy
      );
      
      // Calculate points per block
      const pointsPerBlock = roundedAmount / rule.reward.blockSize;
      
      // Apply base rate (always 1x)
      basePoints = this.applyRounding(
        pointsPerBlock * rule.reward.baseMultiplier, 
        rule.reward.pointsRoundingStrategy
      );
      
      // Only apply bonus rate if minimum spend threshold is met
      if (minSpendMet) {
        bonusPoints = this.applyRounding(
          pointsPerBlock * effectiveMultiplier,
          rule.reward.pointsRoundingStrategy
        );
      } else {
        bonusPoints = 0;
      }
    } else {
      // Direct method:
      // 1. Multiply amount by total rate (base=1 + bonus multiplier)
      // 2. Round the result
      
      // Base points calculation 
      basePoints = this.applyRounding(
        input.amount * rule.reward.baseMultiplier,
        rule.reward.pointsRoundingStrategy
      );
      
      // Only apply bonus if minimum spend threshold is met
      if (minSpendMet) {
        // Calculate total points with multiplier
        const totalPoints = this.applyRounding(
          input.amount * (rule.reward.baseMultiplier + effectiveMultiplier),
          rule.reward.pointsRoundingStrategy
        );
        
        // Bonus is the difference between total and base
        bonusPoints = totalPoints - basePoints;
      } else {
        bonusPoints = 0;
      }
    }
    
    // Apply monthly cap if specified
    let actualBonusPoints = bonusPoints;
    let remainingMonthlyBonusPoints;
    
    if (rule.reward.monthlyCap && rule.reward.monthlyCap > 0 && minSpendMet) {
      const usedBonusPoints = input.usedBonusPoints || 0;
      
      // Check if already reached the cap
      if (usedBonusPoints >= rule.reward.monthlyCap) {
        actualBonusPoints = 0;
        remainingMonthlyBonusPoints = 0;
      } else {
        // Check if this would exceed the cap
        const remainingCap = rule.reward.monthlyCap - usedBonusPoints;
        if (bonusPoints > remainingCap) {
          actualBonusPoints = remainingCap;
          remainingMonthlyBonusPoints = 0;
        } else {
          remainingMonthlyBonusPoints = remainingCap - bonusPoints;
        }
      }
    }
    
    // Create messages
    const messages: string[] = [];
    
    if (!minSpendMet && rule.reward.monthlyMinSpend) {
      messages.push(`Minimum monthly spend of ${rule.reward.monthlyMinSpend} not met for bonus points`);
    } else if (bonusPoints > 0 && actualBonusPoints === 0) {
      messages.push('Monthly bonus points cap reached');
    } else if (appliedTier) {
      messages.push(`Applied tier: ${appliedTier.name} (${effectiveMultiplier}x)`);
    } else if (rule.description) {
      messages.push(`Applied rule: ${rule.description}`);
    }
    
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
   * Check if minimum monthly spend threshold is met
   */
  private isMinimumSpendMet(rule: RewardRule, input: CalculationInput): boolean {
    // If no minimum spend requirement, always return true
    if (!rule.reward.monthlyMinSpend || rule.reward.monthlyMinSpend <= 0) {
      return true;
    }
    
    // If monthly spend data is not provided, assume threshold is not met
    if (!input.monthlySpend) {
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
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, input)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Evaluate a single condition
   */
  public evaluateCondition(condition: RuleCondition, input: CalculationInput): boolean {
    // For compound conditions
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
    
    // Handle specific condition types
    switch (condition.type) {
      case 'mcc':
        return this.evaluateMccCondition(condition, input);
      
      case 'merchant':
        return this.evaluateMerchantCondition(condition, input);
      
      case 'transaction_type':
        return this.evaluateTransactionTypeCondition(condition, input);
      
      case 'currency':
        return this.evaluateCurrencyCondition(condition, input);
      
      case 'amount':
        return this.evaluateAmountCondition(condition, input);
      
      case 'date':
        return this.evaluateDateCondition(condition, input);
      
      case 'category':
        return this.evaluateCategoryCondition(condition, input);
      
      case 'spend_threshold':
        return this.evaluateSpendThresholdCondition(condition, input);
      
      default:
        return false;
    }
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
    
    // Implementation depends on your needs
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
    if (!condition.values || !input.monthlySpend) {
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
