import { RewardRule, RewardRuleFactory, TieredRateConfig } from './BaseRewardCard';
import { supabase } from '@/integrations/supabase/client';

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
 */
export class CardRuleService {
  private rules: Map<string, RuleConfiguration> = new Map();
  
  /**
   * Loads rules from the database or falls back to hardcoded examples
   */
  async loadRules(): Promise<RuleConfiguration[]> {
    try {
      // Attempt to load from Supabase
      const { data, error } = await supabase
        .from('card_rules')
        .select('*');
        
      if (error) {
        console.error('Error loading rules from database:', error);
        return this.loadSampleRules();
      }
      
      if (!data || data.length === 0) {
        console.log('No rules found in database, using sample rules');
        return this.loadSampleRules();
      }
      
      // Transform database data to RuleConfiguration objects
      const rules = data.map(dbRule => ({
        id: dbRule.id,
        name: dbRule.name,
        description: dbRule.description,
        cardType: dbRule.card_type,
        enabled: dbRule.enabled,
        rounding: dbRule.rounding as any,
        basePointRate: dbRule.base_point_rate,
        bonusPointRate: dbRule.bonus_point_rate,
        monthlyCap: dbRule.monthly_cap,
        isOnlineOnly: dbRule.is_online_only,
        isContactlessOnly: dbRule.is_contactless_only,
        includedMCCs: dbRule.included_mccs || [],
        excludedMCCs: dbRule.excluded_mccs || [],
        minSpend: dbRule.min_spend,
        maxSpend: dbRule.max_spend,
        currencyRestrictions: dbRule.currency_restrictions,
        customParams: dbRule.custom_params
      })) as RuleConfiguration[];
      
      // Store rules in memory
      rules.forEach(rule => {
        this.rules.set(rule.id, rule);
      });
      
      return rules;
    } catch (error) {
      console.error('Error in loadRules:', error);
      return this.loadSampleRules();
    }
  }
  
  /**
   * Loads hardcoded sample rules as a fallback
   */
  private loadSampleRules(): RuleConfiguration[] {
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
      }
    ];
    
    // Store rules in memory
    sampleRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
    
    return sampleRules;
  }
  
  /**
   * Saves a rule to the database and local cache
   */
  async saveRule(rule: RuleConfiguration): Promise<boolean> {
    try {
      // Format rule for database
      const dbRule = {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        card_type: rule.cardType,
        enabled: rule.enabled,
        rounding: rule.rounding,
        base_point_rate: rule.basePointRate,
        bonus_point_rate: rule.bonusPointRate,
        monthly_cap: rule.monthlyCap,
        is_online_only: rule.isOnlineOnly,
        is_contactless_only: rule.isContactlessOnly,
        included_mccs: rule.includedMCCs,
        excluded_mccs: rule.excludedMCCs,
        min_spend: rule.minSpend,
        max_spend: rule.maxSpend,
        currency_restrictions: rule.currencyRestrictions,
        custom_params: rule.customParams
      };
      
      // Save to Supabase
      const { error } = await supabase
        .from('card_rules')
        .upsert(dbRule);
        
      if (error) {
        console.error('Error saving rule to database:', error);
        // Store in local cache even if database save fails
        this.rules.set(rule.id, rule);
        return false;
      }
      
      // Update local cache
      this.rules.set(rule.id, rule);
      console.log(`Rule ${rule.id} saved successfully`);
      return true;
    } catch (error) {
      console.error('Error in saveRule:', error);
      // Still update local cache
      this.rules.set(rule.id, rule);
      return false;
    }
  }
  
  /**
   * Validates a rule configuration for consistency and compatibility
   * Returns an array of validation errors, or an empty array if valid
   */
  validateRule(rule: RuleConfiguration): string[] {
    const errors: string[] = [];
    
    // Check required fields
    if (!rule.id) errors.push('Rule ID is required');
    if (!rule.name) errors.push('Rule name is required');
    if (!rule.cardType) errors.push('Card type is required');
    
    // Validate point rates
    if (rule.basePointRate < 0) errors.push('Base point rate cannot be negative');
    if (rule.bonusPointRate < 0) errors.push('Bonus point rate cannot be negative');
    
    // Validate cap
    if (rule.monthlyCap < 0) errors.push('Monthly cap cannot be negative');
    
    // Check for conflicts in excluded and included MCCs
    const conflictingMCCs = rule.includedMCCs.filter(mcc => 
      rule.excludedMCCs.includes(mcc)
    );
    
    if (conflictingMCCs.length > 0) {
      errors.push(`MCCs cannot be both included and excluded: ${conflictingMCCs.join(', ')}`);
    }
    
    // Validate spend thresholds
    if (rule.minSpend !== undefined && rule.maxSpend !== undefined) {
      if (rule.minSpend > rule.maxSpend) {
        errors.push('Minimum spend cannot be greater than maximum spend');
      }
    }
    
    return errors;
  }
  
  /**
   * Deletes a rule from the database and local cache
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('card_rules')
        .delete()
        .match({ id: ruleId });
        
      if (error) {
        console.error('Error deleting rule from database:', error);
        return false;
      }
      
      // Remove from local cache
      const success = this.rules.delete(ruleId);
      return success;
    } catch (error) {
      console.error('Error in deleteRule:', error);
      return false;
    }
  }
  
  /**
   * Gets a rule by ID from local cache
   */
  getRule(ruleId: string): RuleConfiguration | null {
    const rule = this.rules.get(ruleId);
    return rule || null;
  }
  
  /**
   * Gets all rules for a specific card type from local cache
   */
  getRulesForCardType(cardType: string): RuleConfiguration[] {
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

// Export a singleton instance
export const cardRuleService = new CardRuleService();
