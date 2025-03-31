import { BaseCalculator, CalculationInput, BonusPointsCap, MonthlyCap } from './BaseCalculator';
import { cardRuleService, RuleConfiguration } from '@/components/expense/cards/CardRuleService';
import { RewardRule, RewardRuleFactory } from '@/components/expense/cards/BaseRewardCard';

/**
 * A calculator implementation that uses rules from CardRuleService
 * to perform calculations based on user-defined card configurations.
 */
export class RuleBasedCalculator extends BaseCalculator {
  private cardType: string;
  private rules: RuleConfiguration[] = [];
  private mainRule: RuleConfiguration | null = null;
  private eligibilityRules: RewardRule[] = [];
  
  /**
   * Create a calculator for a specific card type
   */
  constructor(cardType: string) {
    super();
    this.cardType = cardType;
    this.loadRules();
  }
  
  /**
   * Load rules from the CardRuleService
   */
  private async loadRules() {
    try {
      // Load all rules for this card type
      this.rules = await cardRuleService.getRulesForCardType(this.cardType);
      
      // Set the main rule (first enabled rule or null if none)
      this.mainRule = this.rules.find(rule => rule.enabled) || null;
      
      // Convert rule configurations to RewardRule objects for eligibility checks
      if (this.mainRule) {
        this.eligibilityRules = this.convertRuleToEligibilityRules(this.mainRule);
      }
    } catch (error) {
      console.error(`Error loading rules for card type ${this.cardType}:`, error);
    }
  }
  
  /**
   * Convert a rule configuration to a list of RewardRule objects
   */
  private convertRuleToEligibilityRules(rule: RuleConfiguration): RewardRule[] {
    const rules: RewardRule[] = [];
    
    // Add rules based on configuration
    if (rule.isOnlineOnly) {
      rules.push(RewardRuleFactory.createOnlineTransactionRule());
    }
    
    if (rule.isContactlessOnly) {
      rules.push(RewardRuleFactory.createContactlessTransactionRule());
    }
    
    if (rule.includedMCCs && rule.includedMCCs.length > 0) {
      rules.push(RewardRuleFactory.createMCCInclusionRule(rule.includedMCCs));
    }
    
    if (rule.excludedMCCs && rule.excludedMCCs.length > 0) {
      rules.push(RewardRuleFactory.createMCCExclusionRule(rule.excludedMCCs));
    }
    
    if (rule.currencyRestrictions && rule.currencyRestrictions.length > 0) {
      // Handle special case for negated currency restrictions (!SGD)
      const negatedCurrencies = rule.currencyRestrictions
        .filter(c => c.startsWith('!'))
        .map(c => c.substring(1));
      
      const includedCurrencies = rule.currencyRestrictions
        .filter(c => !c.startsWith('!'));
      
      const currencyRule = {
        isEligible: (input: CalculationInput) => {
          if (!input.currency) return false;
          
          // Check negated currencies
          if (negatedCurrencies.length > 0 && negatedCurrencies.includes(input.currency)) {
            return false;
          }
          
          // Check included currencies
          if (includedCurrencies.length > 0) {
            return includedCurrencies.includes(input.currency);
          }
          
          return true;
        },
        calculatePoints: () => 0
      };
      
      rules.push(currencyRule);
    }
    
    // Create a compound rule if we have multiple rules
    if (rules.length > 1) {
      return [RewardRuleFactory.createAnyRule(rules)];
    }
    
    return rules.length > 0 ? rules : [];
  }
  
  /**
   * Get the current active rule
   */
  private getActiveRule(): RuleConfiguration | null {
    // Reload rules if they haven't been loaded yet
    if (this.rules.length === 0) {
      this.loadRules();
    }
    
    return this.mainRule;
  }
  
  /**
   * Apply the specified rounding method to the amount
   */
  calculateRoundedAmount(amount: number): number {
    const rule = this.getActiveRule();
    if (!rule) return Math.floor(amount); // Default to floor rounding
    
    switch (rule.rounding) {
      case 'floor':
        return Math.floor(amount);
      case 'ceiling':
        return Math.ceil(amount);
      case 'nearest5':
        return Math.floor(amount / 5) * 5;
      case 'nearest':
        return Math.round(amount);
      default:
        return Math.floor(amount);
    }
  }
  
  /**
   * Calculate base points according to the rule's base point rate
   */
  calculateBasePoints(roundedAmount: number): number {
    const rule = this.getActiveRule();
    if (!rule) return Math.floor(roundedAmount); // Default to 1 point per dollar
    
    return Math.round(roundedAmount * rule.basePointRate);
  }
  
  /**
   * Check if a transaction is eligible for bonus points
   */
  getBonusPointsEligibility(input: CalculationInput): boolean {
    // Special case for UOB Lady's Solitaire card
    if (this.cardType === 'uob-ladys-solitaire') {
      return this.isUOBLadysCategoryEligible(input);
    }
    
    // If no rules or eligibility rules, not eligible
    if (!this.mainRule || this.eligibilityRules.length === 0) {
      return false;
    }
    
    // Check each rule for eligibility
    return this.eligibilityRules.some(rule => rule.isEligible(input));
  }
  
  /**
   * Determine if a transaction is eligible for UOB Lady's bonus
   * based on selected categories in payment method
   */
  private isUOBLadysCategoryEligible(input: CalculationInput): boolean {
    // Category MCCs for UOB Lady's card
    const categoryMCCs: Record<string, string[]> = {
      'Beauty & Wellness': ['5912', '5977', '7230', '7231', '7298', '7297', '5912', '5977', '7230', '7231', '7298', '7297'],
      'Dining': ['5811', '5812', '5814', '5499'],
      'Entertainment': ['5813', '7832', '7922'],
      'Family': ['5411', '5641'],
      'Fashion': ['5311', '5611', '5621', '5631', '5651', '5655', '5661', '5691', '5699', '5948'],
      'Transport': ['4111', '4121', '4789', '5541', '5542'],
      'Travel': [...Array(300).map((_, i) => `${3000 + i}`), '7011', '7512']
    };
    
    // Check if we have a payment method, MCC, and selected categories
    if (!input.paymentMethod || !input.mcc || 
        !input.paymentMethod.selectedCategories || 
        input.paymentMethod.selectedCategories.length === 0) {
      return false;
    }
    
    // Check if transaction MCC falls into any selected category
    for (const category of input.paymentMethod.selectedCategories) {
      const categoryMCCList = categoryMCCs[category] || [];
      if (categoryMCCList.includes(input.mcc)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Calculate bonus points according to the rule's bonus point rate
   */
  calculateBonusPoints(roundedAmount: number): number {
    const rule = this.getActiveRule();
    if (!rule) return 0; // Default to no bonus points
    
    return Math.round(roundedAmount * rule.bonusPointRate);
  }
  
  /**
   * Get the bonus points cap from the rule
   */
  getBonusPointsCap(): BonusPointsCap {
    const rule = this.getActiveRule();
    if (!rule) return new MonthlyCap(0); // Default to no cap
    
    return new MonthlyCap(rule.monthlyCap);
  }
  
  /**
   * Get the points currency from the rule
   */
  getPointsCurrency(): string {
    const rule = this.getActiveRule();
    return rule?.pointsCurrency || 'Points';
  }
}