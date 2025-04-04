
import { BaseCalculator, CalculationInput, RuleCondition } from './BaseCalculator';

/**
 * Generic calculator that can handle most common card reward scenarios
 * This can be configured through rules rather than requiring new subclasses
 */
export class GenericCardCalculator extends BaseCalculator {
  private rules: Array<{
    id: string;
    condition: RuleCondition;
    basePointRate: number;
    bonusPointRate: number;
    monthlyCap: number;
  }> = [];
  
  private defaultBaseRate: number = 1; // Default 1 point per dollar
  private pointsCurrencyValue: string = 'Points';
  
  /**
   * Configure the calculator with custom settings
   */
  public configure(config: {
    defaultBaseRate?: number;
    pointsCurrency?: string;
    roundingType?: 'floor' | 'ceiling' | 'nearest' | 'nearest5';
  }): void {
    if (config.defaultBaseRate !== undefined) {
      this.defaultBaseRate = config.defaultBaseRate;
    }
    
    if (config.pointsCurrency) {
      this.pointsCurrencyValue = config.pointsCurrency;
    }
    
    if (config.roundingType) {
      this.setRoundingStrategy(config.roundingType);
    }
  }
  
  /**
   * Add a rule to the calculator
   */
  public addRule(id: string, condition: RuleCondition, basePointRate: number, bonusPointRate: number, monthlyCap: number = 0): void {
    this.rules.push({
      id,
      condition,
      basePointRate,
      bonusPointRate,
      monthlyCap
    });
  }
  
  /**
   * Remove a rule from the calculator
   */
  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }
  
  /**
   * Update an existing rule
   */
  public updateRule(ruleId: string, condition: RuleCondition, basePointRate: number, bonusPointRate: number, monthlyCap: number = 0): void {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index >= 0) {
      this.rules[index] = {
        id: ruleId,
        condition,
        basePointRate,
        bonusPointRate,
        monthlyCap
      };
    }
  }
  
  /**
   * Override the base point calculation
   */
  protected calculateBasePoints(roundedAmount: number, input: CalculationInput): number {
    // Apply the eligible rule with the highest bonus rate
    const eligibleRule = this.findEligibleRuleWithHighestRate(input);
    
    if (eligibleRule) {
      return roundedAmount * eligibleRule.basePointRate;
    }
    
    // Default to the configured base rate
    return roundedAmount * this.defaultBaseRate;
  }
  
  /**
   * Override the bonus point calculation
   */
  protected calculateBonusPoints(roundedAmount: number, input: CalculationInput): { 
    bonusPoints: number; 
    remainingMonthlyBonusPoints?: number;
  } {
    // Apply the eligible rule with the highest bonus rate
    const eligibleRule = this.findEligibleRuleWithHighestRate(input);
    
    if (!eligibleRule) {
      return { bonusPoints: 0 };
    }
    
    // Calculate the potential bonus points
    const potentialBonusPoints = roundedAmount * eligibleRule.bonusPointRate;
    
    // Check if there's a monthly cap
    if (eligibleRule.monthlyCap > 0) {
      const usedBonusPoints = input.usedBonusPoints || 0;
      
      // Check if we've already reached the cap
      if (usedBonusPoints >= eligibleRule.monthlyCap) {
        return { 
          bonusPoints: 0,
          remainingMonthlyBonusPoints: 0
        };
      }
      
      // Check if this transaction would exceed the cap
      const remainingCap = eligibleRule.monthlyCap - usedBonusPoints;
      if (potentialBonusPoints > remainingCap) {
        return {
          bonusPoints: remainingCap,
          remainingMonthlyBonusPoints: 0
        };
      }
      
      // Still within cap
      return {
        bonusPoints: potentialBonusPoints,
        remainingMonthlyBonusPoints: remainingCap - potentialBonusPoints
      };
    }
    
    // No cap, full bonus
    return { 
      bonusPoints: potentialBonusPoints
    };
  }
  
  /**
   * Override the points currency getter
   */
  public override getPointsCurrency(input?: CalculationInput): string {
    return this.pointsCurrencyValue;
  }
  
  /**
   * Find the eligible rule with the highest combined rate
   */
  private findEligibleRuleWithHighestRate(input: CalculationInput): {
    id: string;
    condition: RuleCondition;
    basePointRate: number;
    bonusPointRate: number;
    monthlyCap: number;
  } | null {
    const eligibleRules = this.rules.filter(rule => this.isEligibleForRule(input, rule.condition));
    
    if (eligibleRules.length === 0) {
      return null;
    }
    
    // Sort by total rate (base + bonus) descending and return the highest
    return eligibleRules.sort((a, b) => 
      (b.basePointRate + b.bonusPointRate) - (a.basePointRate + a.bonusPointRate)
    )[0];
  }
  
  /**
   * Check if the input meets the conditions for a rule
   */
  private isEligibleForRule(input: CalculationInput, condition: RuleCondition): boolean {
    // Check MCC inclusion
    if (condition.mccCodes && condition.mccCodes.length > 0) {
      if (!input.mcc || !condition.mccCodes.includes(input.mcc)) {
        return false;
      }
    }
    
    // Check MCC exclusion
    if (condition.excludedMccCodes && condition.excludedMccCodes.length > 0) {
      if (input.mcc && condition.excludedMccCodes.includes(input.mcc)) {
        return false;
      }
    }
    
    // Check merchant names
    if (condition.merchantNames && condition.merchantNames.length > 0) {
      if (!input.merchantName || !condition.merchantNames.some(name => 
        input.merchantName?.toLowerCase().includes(name.toLowerCase())
      )) {
        return false;
      }
    }
    
    // Check online only
    if (condition.isOnlineOnly && !input.isOnline) {
      return false;
    }
    
    // Check contactless only
    if (condition.isContactlessOnly && !input.isContactless) {
      return false;
    }
    
    // Check foreign currency only
    if (condition.foreignCurrencyOnly) {
      // Assuming SGD is the local currency
      if (input.currency === 'SGD') {
        return false;
      }
    }
    
    // Check excluded currencies
    if (condition.excludedCurrencies && condition.excludedCurrencies.length > 0) {
      if (condition.excludedCurrencies.includes(input.currency)) {
        return false;
      }
    }
    
    // Check min amount
    if (condition.minAmount !== undefined && input.amount < condition.minAmount) {
      return false;
    }
    
    // Check max amount
    if (condition.maxAmount !== undefined && input.amount > condition.maxAmount) {
      return false;
    }
    
    // Check custom condition if provided
    if (condition.customCondition && !condition.customCondition(input)) {
      return false;
    }
    
    // All conditions passed
    return true;
  }
}
