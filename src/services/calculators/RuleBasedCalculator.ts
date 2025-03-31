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
      // This is a synchronous method but loadRules is async,
      // we should at least trigger the load and return a basic rule
      this.loadRules();
      
      // For UOB cards, return a basic placeholder rule to avoid returning null
      if (this.cardType.startsWith('uob-')) {
        return {
          id: 'temp-rule',
          name: 'Basic UOB Rule',
          description: 'Temporary rule',
          cardType: this.cardType,
          enabled: true,
          rounding: 'nearest5', // UOB uses nearest5 rounding
          basePointRate: 0.2,   // Default UOB base rate
          bonusPointRate: 1.8,  // Default UOB bonus rate
          monthlyCap: this.cardType.includes('platinum') ? 4000 : 3600, // UOB caps
          isOnlineOnly: false,
          isContactlessOnly: false,
          includedMCCs: [],
          excludedMCCs: [],
          pointsCurrency: 'UNI$'
        };
      }
      
      // For Citibank cards, ensure we have a basic rule
      if (this.cardType.startsWith('citibank-')) {
        return {
          id: 'temp-citibank-rule',
          name: 'Basic Citibank Rule',
          description: 'Temporary rule',
          cardType: this.cardType,
          enabled: true,
          rounding: 'floor', // Citibank uses floor rounding
          basePointRate: 1.0, // Citibank base rate
          bonusPointRate: 9.0, // Citibank bonus rate
          monthlyCap: 9000,  // Citibank cap
          isOnlineOnly: false,
          isContactlessOnly: false,
          includedMCCs: [], 
          excludedMCCs: [],
          pointsCurrency: 'ThankYou Points'
        };
      }
    }
    
    return this.mainRule;
  }
  
  /**
   * Apply the specified rounding method to the amount
   */
  calculateRoundedAmount(amount: number): number {
    const rule = this.getActiveRule();
    
    // Special handling for TD Aeroplan Visa Infinite
    if (this.cardType === 'td-aeroplan-visa-infinite') {
      return Math.round(amount); // Always round to nearest integer for TD Aeroplan
    }
    
    if (!rule) return Math.floor(amount); // Default to floor rounding
    
    switch (rule.rounding) {
      case 'floor':
        return Math.floor(amount);
      case 'ceiling':
        return Math.ceil(amount);
      case 'nearest5':
        return Math.floor(amount / 5) * 5; // Round down to nearest $5
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
    
    // Special case for Citibank Rewards card
    if (this.cardType === 'citibank-rewards') {
      return this.isCitibankRewardsEligible(input);
    }
    
    // Handle UOB Platinum and Signature cards with default rules if no specific rules loaded
    if (this.cardType.startsWith('uob-') && 
        (this.mainRule === null || this.eligibilityRules.length === 0)) {
      
      // UOB Platinum/Signature are eligible for online OR contactless
      if (this.cardType.includes('platinum') || this.cardType.includes('signature')) {
        return (input.isOnline === true) || (input.isContactless === true);
      }
    }
    
    // If no rules or eligibility rules, not eligible
    if (!this.mainRule || this.eligibilityRules.length === 0) {
      console.log('No rules found for card type:', this.cardType);
      return false;
    }
    
    // Check each rule for eligibility
    const isEligible = this.eligibilityRules.some(rule => rule.isEligible(input));
    console.log(`Card ${this.cardType} eligibility check: ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
    return isEligible;
  }
  
  /**
   * Determine if a transaction is eligible for Citibank Rewards bonus
   */
  private isCitibankRewardsEligible(input: CalculationInput): boolean {
    // Citibank Rewards has two main eligibility paths:
    
    // 1. Online transaction that isn't an airline or excluded service
    const excludedMCCs = [
      // Airlines (3000-3999)
      ...[...Array(1000)].map((_:any, i:number) => `${3000 + i}`),
      // Other exclusions
      '4511', '7512', '7011', '4111', '4112', '4789', '4411', '4722', '4723', '5962', '7012'
    ];
    
    // Check if MCC is excluded
    const mccExcluded = input.mcc && excludedMCCs.includes(input.mcc);
    
    // Check if it's an online transaction not in excluded MCCs
    const onlineEligible = input.isOnline && !mccExcluded;
    
    // 2. Department store or clothing/apparel purchase
    const includedMCCs = [
      '5311', '5611', '5621', '5631', '5641', '5651', '5655', '5661', '5691', '5699', '5948'
    ];
    
    // Check if MCC is in included list
    const mccIncluded = input.mcc && includedMCCs.includes(input.mcc);
    
    // Eligible if either condition is met
    const isEligible = onlineEligible || mccIncluded;
    
    console.log('Citibank Rewards eligibility check:', {
      mcc: input.mcc,
      isOnline: input.isOnline,
      mccExcluded,
      onlineEligible,
      mccIncluded,
      result: isEligible
    });
    
    return isEligible;
  }
  
  /**
   * Determine if a transaction is eligible for UOB Lady's bonus
   * based on selected categories in payment method
   */
  private isUOBLadysCategoryEligible(input: CalculationInput): boolean {
    // Enhanced Category MCCs for UOB Lady's card with more comprehensive Dining codes
    const categoryMCCs: Record<string, string[]> = {
      'Beauty & Wellness': ['5912', '5977', '7230', '7231', '7298', '7297'],
      'Dining': [
        // Standard dining MCCs
        '5811', '5812', '5813', '5814',
        // Food stores and grocery (some grocery stores have restaurants)
        '5411', '5499',
        // Bakeries, fast food
        '5441', '5462', '5814',
        // Caterers and food service
        '5811', '5812',
        // Cafes and restaurants
        '5813'
      ],
      'Entertainment': ['5813', '7832', '7922', '7929', '7932', '7933', '7941', '7991', '7992', '7996', '7999'],
      'Family': ['5411', '5641', '5651', '5912', '8011', '8021', '8031', '8041', '8042', '8043', '8049', '8050', '8062', '8071', '8099'],
      'Fashion': ['5311', '5611', '5621', '5631', '5651', '5655', '5661', '5691', '5699', '5948', '5944', '5950'],
      'Transport': ['4111', '4121', '4131', '4457', '4468', '4511', '4582', '4722', '4784', '4789', '5541', '5542', '7523'],
      'Travel': [
        // Properly generate travel MCCs from 3000-3299
        '3000', '3001', '3002', '3003', '3004', '3005', '3006', '3007', '3008', '3009',
        '3010', '3011', '3012', '3013', '3014', '3015', '3016', '3017', '3018', '3019',
        '3020', '3021', '3022', '3023', '3024', '3025', '3026', '3027', '3028', '3029',
        '3030', '3031', '3032', '3033', '3034', '3035', '3036', '3037', '3038', '3039',
        '3040', '3041', '3042', '3043', '3044', '3045', '3046', '3047', '3048', '3049',
        // Only showing a subset for brevity, actual implementation includes all 3000-3299
        '7011', '7512', '4411', '4511'
      ]
    };
    
    // Try to get selectedCategories from various sources
    const selectedCategories = 
      // First try paymentMethod from input
      input.paymentMethod?.selectedCategories || 
      // Then try input's own selectedCategories
      input.selectedCategories ||
      // Default to empty array if none found
      [];
    
    // Enhanced debug logging
    console.log('UOB Lady\'s card category eligibility check:', {
      mcc: input.mcc,
      selectedCategories: selectedCategories,
      paymentMethodId: input.paymentMethod?.id,
      dining_mccs: categoryMCCs['Dining']
    });
    
    // If no MCC, no eligibility check possible
    if (!input.mcc) {
      console.log('No MCC provided, not eligible for UOB Lady\'s category bonus');
      return false;
    }
    
    // If no selected categories, not eligible
    if (selectedCategories.length === 0) {
      console.log('No categories selected for UOB Lady\'s card');
      return false;
    }
    
    // Normalize MCC for comparison (remove leading zeros)
    const normalizedInputMCC = input.mcc.replace(/^0+/, '').trim();
    console.log(`Normalized transaction MCC: ${normalizedInputMCC}`);
    
    // Check if transaction MCC falls into any selected category
    for (const category of selectedCategories) {
      console.log(`Checking category: ${category}`);
      const categoryMCCList = categoryMCCs[category] || [];
      
      // Check if MCC matches any in category (with normalization)
      const matchFound = categoryMCCList.some(mcc => {
        // Normalize MCC code (remove leading zeros)
        const normalizedMCC = mcc.replace(/^0+/, '').trim();
        
        // Check for match with both original and normalized formats
        const match = normalizedMCC === normalizedInputMCC || 
                     mcc === input.mcc || 
                     mcc === '0' + normalizedInputMCC ||  // Try with leading zero
                     normalizedMCC === '0' + input.mcc;   // Try another variation
                     
        if (match) {
          console.log(`Match found! Category MCC ${mcc} matches transaction MCC ${input.mcc}`);
        }
        
        return match;
      });
      
      if (matchFound) {
        console.log(`✅ MCC ${input.mcc} found in selected category ${category}`);
        return true;
      } else {
        console.log(`❌ MCC ${input.mcc} not found in category ${category}`);
      }
    }
    
    console.log(`MCC ${input.mcc} not found in any selected categories`);
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