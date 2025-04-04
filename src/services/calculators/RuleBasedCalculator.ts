
import { 
  BaseCalculator, 
  CalculationInput, 
  CalculationResult, 
  MonthlyCap, 
  RuleCondition 
} from './BaseCalculator';

/**
 * Calculator that uses a rule-based system to determine which rate to apply.
 * This is used for cards with conditional rewards (e.g., different rates for different categories).
 */
export class RuleBasedCalculator extends BaseCalculator {
  private rules: {
    id: string;
    condition: RuleCondition;
    baseRate: number;
    bonusRate: number;
    monthlyCap?: number;
  }[] = [];
  
  private defaultBaseRate = 1;
  private defaultBonusRate = 0;
  
  constructor() {
    super('nearest'); // Default rounding strategy
  }
  
  /**
   * Register a rule with this calculator
   */
  public addRule(
    id: string,
    condition: RuleCondition,
    baseRate: number,
    bonusRate: number = 0,
    monthlyCap: number = 0
  ): void {
    this.rules.push({
      id,
      condition,
      baseRate,
      bonusRate,
      monthlyCap: monthlyCap > 0 ? monthlyCap : undefined
    });
  }
  
  /**
   * Remove a rule by ID
   */
  public removeRule(id: string): void {
    this.rules = this.rules.filter(rule => rule.id !== id);
  }
  
  /**
   * Clear all rules
   */
  public clearRules(): void {
    this.rules = [];
  }
  
  /**
   * Set default rates when no rules match
   */
  public setDefaultRates(baseRate: number, bonusRate: number = 0): void {
    this.defaultBaseRate = baseRate;
    this.defaultBonusRate = bonusRate;
  }
  
  /**
   * Determine if a transaction meets the condition
   */
  private meetsCondition(input: CalculationInput, condition: RuleCondition): boolean {
    // Empty condition passes by default
    if (!condition || Object.keys(condition).length === 0) {
      return true;
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
    if (condition.foreignCurrencyOnly && input.currency === input.paymentMethod.currency) {
      return false;
    }
    
    // Check currency restrictions
    if (condition.currencyRestrictions && condition.currencyRestrictions.length > 0) {
      if (condition.currencyRestrictions.some(curr => curr.startsWith('!'))) {
        // Format is ["!SGD"] meaning "any currency except SGD"
        const excludedCurrencies = condition.currencyRestrictions
          .filter(curr => curr.startsWith('!'))
          .map(curr => curr.substring(1));
        
        if (excludedCurrencies.includes(input.currency)) {
          return false;
        }
      } else {
        // Format is ["USD", "EUR"] meaning "only USD or EUR"
        if (!condition.currencyRestrictions.includes(input.currency)) {
          return false;
        }
      }
    }
    
    // Check included MCCs
    const mccToCheck = input.mcc;
    if (condition.mccCodes && condition.mccCodes.length > 0 && mccToCheck) {
      if (!condition.mccCodes.includes(mccToCheck)) {
        return false;
      }
    } else if (condition.includedMCCs && condition.includedMCCs.length > 0 && mccToCheck) {
      if (!condition.includedMCCs.includes(mccToCheck)) {
        return false;
      }
    }
    
    // Check excluded MCCs
    if (condition.excludedMccCodes && condition.excludedMccCodes.length > 0 && mccToCheck) {
      if (condition.excludedMccCodes.includes(mccToCheck)) {
        return false;
      }
    } else if (condition.excludedMCCs && condition.excludedMCCs.length > 0 && mccToCheck) {
      if (condition.excludedMCCs.includes(mccToCheck)) {
        return false;
      }
    }
    
    // Check merchant names
    if (condition.merchantNames && condition.merchantNames.length > 0 && input.merchantName) {
      const merchantNameLower = input.merchantName.toLowerCase();
      const matches = condition.merchantNames.some(name => 
        merchantNameLower.includes(name.toLowerCase())
      );
      
      if (!matches) {
        return false;
      }
    }
    
    // Check min amount
    if ((condition.minAmount !== undefined || condition.minSpend !== undefined) && 
        input.amount < (condition.minAmount || condition.minSpend || 0)) {
      return false;
    }
    
    // Check max amount
    if ((condition.maxAmount !== undefined || condition.maxSpend !== undefined) && 
        input.amount > (condition.maxAmount || condition.maxSpend || Infinity)) {
      return false;
    }
    
    // Check custom condition if provided
    if (condition.customCondition && !condition.customCondition(input)) {
      return false;
    }
    
    // All conditions passed
    return true;
  }
  
  /**
   * Find the first matching rule
   */
  private findMatchingRule(input: CalculationInput): { 
    baseRate: number; 
    bonusRate: number; 
    monthlyCap?: number; 
    ruleId?: string;
  } {
    for (const rule of this.rules) {
      if (this.meetsCondition(input, rule.condition)) {
        return {
          baseRate: rule.baseRate,
          bonusRate: rule.bonusRate,
          monthlyCap: rule.monthlyCap,
          ruleId: rule.id
        };
      }
    }
    
    // No matching rule, return default rates
    return {
      baseRate: this.defaultBaseRate,
      bonusRate: this.defaultBonusRate
    };
  }
  
  /**
   * Calculate base points based on base rate from matching rule
   */
  protected calculateBasePoints(roundedAmount: number, input: CalculationInput): number {
    const { baseRate } = this.findMatchingRule(input);
    return Math.round(roundedAmount * baseRate);
  }
  
  /**
   * Calculate bonus points based on bonus rate from matching rule
   * Handle monthly caps if specified
   */
  protected calculateBonusPoints(roundedAmount: number, input: CalculationInput): { 
    bonusPoints: number; 
    remainingMonthlyBonusPoints?: number;
  } {
    const { bonusRate, monthlyCap, ruleId } = this.findMatchingRule(input);
    
    // No bonus if rate is 0
    if (bonusRate <= 0) {
      return { bonusPoints: 0 };
    }
    
    // Calculate potential bonus points
    const potentialBonusPoints = Math.round(roundedAmount * bonusRate);
    
    // Handle monthly cap if specified
    if (monthlyCap !== undefined && monthlyCap > 0) {
      const usedBonusPoints = input.usedBonusPoints || 0;
      
      // Create a monthly cap object
      const monthlyCapObj = new MonthlyCap(monthlyCap, usedBonusPoints);
      
      // Determine how many points can be earned with the cap
      const availableBonusPoints = Math.min(
        potentialBonusPoints,
        monthlyCapObj.remainingAmount
      );
      
      return {
        bonusPoints: availableBonusPoints,
        remainingMonthlyBonusPoints: monthlyCapObj.remainingAmount - availableBonusPoints
      };
    }
    
    // No cap, return all potential bonus points
    return { bonusPoints: potentialBonusPoints };
  }
}
