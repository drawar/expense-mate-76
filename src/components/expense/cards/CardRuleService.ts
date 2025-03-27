import { RewardRule, RewardRuleFactory, TieredRateConfig } from './BaseRewardCard';

/**
 * Serializable rule configuration format that can be stored in a database
 * and used to generate RewardRule objects
 */
export interface RuleConfiguration {
  id: string;
  name: string;
  description: string;
  cardType: string;
  enabled: boolean;
  
  // Base calculation settings
  rounding: 'floor' | 'ceiling' | 'nearest5' | 'nearest' | 'pointRounding';
  basePointRate: number;
  bonusPointRate: number;
  monthlyCap: number;
  
  // Eligibility settings
  isOnlineOnly: boolean;
  isContactlessOnly: boolean;
  
  // MCC settings
  includedMCCs: string[];
  excludedMCCs: string[];
  
  // Additional conditions
  minSpend?: number;
  maxSpend?: number;
  currencyRestrictions?: string[];
  
  // New properties for advanced configurations
  categoriesByMCC?: Record<string, string[]>;   // Maps categories to MCCs
  maxCategoriesSelectable?: number;             // Number of categories that can be selected
  tieredRates?: TieredRateConfig[];             // For multi-tiered reward rates
  includedMerchantNames?: string[];             // For merchant name-based rules
  monthlySpendCap?: number;                     // Cap on spend eligible for highest tier
  monthlyCalculationType?: 'transaction' | 'aggregate'; // How monthly bonuses are calculated
  pointRoundingType?: 'up' | 'down' | 'nearest'; // Point rounding rule
  
  // Custom rule parameters - for card-specific rules
  customParams?: Record<string, any>;
}

/**
 * Service for loading, saving, and managing card reward rules
 * 
 * This demonstrates how the reward system could integrate with a database
 * or external API for rule management
 */
export class CardRuleService {
  private rules: Map<string, RuleConfiguration> = new Map();
  
  /**
   * Loads rules from a database, API, or local storage
   */
  async loadRules(): Promise<RuleConfiguration[]> {
    // In a real implementation, this would fetch from an API or database
    // Here we're using a hardcoded example
    const sampleRules: RuleConfiguration[] = [
      {
        id: 'citibank-rewards-default',
        name: 'Citibank Rewards Default Rule',
        description: 'Default rule for Citibank Rewards card',
        cardType: 'CitibankRewards',
        enabled: true,
        rounding: 'floor',
        basePointRate: 0.4,
        bonusPointRate: 3.6,
        monthlyCap: 4000,
        isOnlineOnly: false,
        isContactlessOnly: false,
        includedMCCs: ['5311', '5611', '5621', '5631', '5641', '5651', '5655', '5661', '5691', '5699', '5948'],
        excludedMCCs: [
          // Airlines
          ...Array.from({ length: 1000 }, (_, i) => `${3000 + i}`),
          // Other exclusions
          '4511', '7512', '7011', '4111', '4112', '4789', '4411', '4722', '4723', '5962', '7012'
        ]
      },
      {
        id: 'uob-platinum-default',
        name: 'UOB Platinum Default Rule',
        description: 'Default rule for UOB Platinum card',
        cardType: 'UOBPlatinum',
        enabled: true,
        rounding: 'nearest5',
        basePointRate: 0.4,
        bonusPointRate: 3.6,
        monthlyCap: 4000,
        isOnlineOnly: false,
        isContactlessOnly: false,
        includedMCCs: [
          '4816', '5262', '5306', '5309', '5310', '5311', '5331', '5399', 
          '5611', '5621', '5631', '5641', '5651', '5661', '5691', '5699',
          '5732', '5733', '5734', '5735', '5912', '5942', '5944', '5945',
          '5946', '5947', '5948', '5949', '5964', '5965', '5966', '5967',
          '5968', '5969', '5970', '5992', '5999', '5811', '5812', '5814',
          '5333', '5411', '5441', '5462', '5499', '8012', '9751', '7278',
          '7832', '7841', '7922', '7991', '7996', '7998', '7999'
        ],
        excludedMCCs: []
      },
      {
        id: 'uob-signature-default',
        name: 'UOB Signature Default Rule',
        description: 'Default rule for UOB Signature card',
        cardType: 'UOBSignature',
        enabled: true,
        rounding: 'nearest5',
        basePointRate: 0.4,
        bonusPointRate: 3.6,
        monthlyCap: 8000,
        isOnlineOnly: false,
        isContactlessOnly: false,
        includedMCCs: [],
        excludedMCCs: [],
        currencyRestrictions: ['!SGD'], // All currencies except SGD
        customParams: {
          minForeignSpend: 1000,
          sgdTransactionsAllowed: false
        }
      },
      {
        id: 'custom-user-rule-1',
        name: 'My Shopping Rewards',
        description: 'Custom rule for shopping categories',
        cardType: 'CitibankRewards',
        enabled: true,
        rounding: 'floor',
        basePointRate: 0.4,
        bonusPointRate: 3.6,
        monthlyCap: 4000,
        isOnlineOnly: true,
        isContactlessOnly: false,
        includedMCCs: ['5311', '5411', '5611'], // Shopping categories
        excludedMCCs: []
      }
    ];
    
    // Store rules in memory
    sampleRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
    
    return sampleRules;
  }
  
  /**
   * Saves a rule to storage
   */
  async saveRule(rule: RuleConfiguration): Promise<boolean> {
    // In a real implementation, this would save to an API or database
    this.rules.set(rule.id, rule);
    console.log(`Rule ${rule.id} saved`);
    return true;
  }
  
  /**
   * Deletes a rule from storage
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    // In a real implementation, this would delete from an API or database
    const success = this.rules.delete(ruleId);
    return success;
  }
  
  /**
   * Gets a rule by ID
   */
  async getRule(ruleId: string): Promise<RuleConfiguration | null> {
    const rule = this.rules.get(ruleId);
    return rule || null;
  }
  
  /**
   * Gets all rules for a specific card type
   */
  async getRulesForCardType(cardType: string): Promise<RuleConfiguration[]> {
    return Array.from(this.rules.values())
      .filter(rule => rule.cardType === cardType && rule.enabled);
  }
  
  /**
   * Converts a stored rule configuration to a RewardRule object
   */
  convertToRewardRule(config: RuleConfiguration): RewardRule[] {
    const rules: RewardRule[] = [];
    
    // Add online transaction rule if enabled
    if (config.isOnlineOnly) {
      rules.push(RewardRuleFactory.createOnlineTransactionRule());
    }
    
    // Add contactless transaction rule if enabled
    if (config.isContactlessOnly) {
      rules.push(RewardRuleFactory.createContactlessTransactionRule());
    }
    
    // Add MCC inclusion rule if MCCs are defined
    if (config.includedMCCs.length > 0) {
      rules.push(RewardRuleFactory.createMCCInclusionRule(config.includedMCCs));
    }
    
    // Add MCC exclusion rule if MCCs are defined
    if (config.excludedMCCs.length > 0) {
      rules.push(RewardRuleFactory.createMCCExclusionRule(config.excludedMCCs));
    }
    
    // Create a complete rule combining all conditions
    if (rules.length > 1) {
      return [RewardRuleFactory.createAnyRule(rules)];
    }
    
    return rules;
  }
}

/**
 * Example of how to use the CardRuleService
 */
async function exampleUsage() {
  const ruleService = new CardRuleService();
  
  // Load all rules from storage
  await ruleService.loadRules();
  
  // Get rules for a specific card
  const citiRules = await ruleService.getRulesForCardType('CitibankRewards');
  
  // Create a new custom rule
  const newRule: RuleConfiguration = {
    id: 'custom-user-rule-2',
    name: 'Dining Rewards',
    description: 'Custom rule for dining categories',
    cardType: 'CitibankRewards',
    enabled: true,
    rounding: 'floor',
    basePointRate: 0.4,
    bonusPointRate: 5.0, // Higher rate for dining
    monthlyCap: 4000,
    isOnlineOnly: false,
    isContactlessOnly: false,
    includedMCCs: ['5812', '5813', '5814'], // Dining categories
    excludedMCCs: []
  };
  
  // Save the new rule
  await ruleService.saveRule(newRule);
  
  // Convert rules to RewardRule objects that can be used for calculations
  const firstRule = citiRules[0];
  const ruleObjects = ruleService.convertToRewardRule(firstRule);
  
  console.log(`Converted ${ruleObjects.length} rule objects from rule: ${firstRule.name}`);
}