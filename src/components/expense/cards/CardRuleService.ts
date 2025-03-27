import { RewardRule, RewardRuleFactory, TieredRateConfig } from './BaseRewardCard';
import { supabase } from '@/integrations/supabase/client';

/**
 * Serializable rule configuration format that can be stored in a database
 * and used to generate RewardRule objects
 */
export interface RuleConfiguration {
  id: string;
  name: string;
  description?: string;
  cardType: string;
  enabled: boolean;
  rounding: 'floor' | 'ceiling' | 'nearest5' | 'nearest' | 'pointRounding';
  basePointRate: number;
  bonusPointRate: number;
  monthlyCap: number;
  isOnlineOnly?: boolean;
  isContactlessOnly?: boolean;
  includedMCCs?: string[];
  excludedMCCs?: string[];
  minSpend?: number;
  maxSpend?: number;
  currencyRestrictions?: string[];
  categoriesByMCC?: Record<string, string[]>;
  maxCategoriesSelectable?: number;
  tieredRates?: TieredRateConfig[];
  pointsCurrency?: string;
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
      const { data, error } = await supabase
        .from('card_rules')
        .select('*');
        
      if (error) {
        console.error('Error loading rules:', error);
        return this.loadSampleRules();
      }
      
      const rules = data.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description || '',
        cardType: rule.card_type,
        enabled: rule.enabled,
        rounding: rule.rounding as 'floor' | 'ceiling' | 'nearest5' | 'nearest' | 'pointRounding',
        basePointRate: rule.base_point_rate,
        bonusPointRate: rule.bonusPointRate,
        monthlyCap: rule.monthly_cap,
        isOnlineOnly: rule.is_online_only,
        isContactlessOnly: rule.is_contactless_only,
        includedMCCs: rule.included_mccs || [],
        excludedMCCs: rule.excluded_mccs || [],
        minSpend: rule.min_spend,
        maxSpend: rule.max_spend,
        currencyRestrictions: rule.currency_restrictions,
        pointsCurrency: rule.custom_params?.pointsCurrency,
        customParams: rule.custom_params || {}
      } as RuleConfiguration));
      
      rules.forEach(rule => this.rules.set(rule.id, rule));
      
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
        ],
        pointsCurrency: 'ThankYou Points'
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
        excludedMCCs: [],
        pointsCurrency: 'UNI$'
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
        pointsCurrency: 'UNI$',
        customParams: {
          minForeignSpend: 1000,
          sgdTransactionsAllowed: false
        }
      },
      {
        id: 'amex-platinum-sg-default',
        name: 'Amex Platinum Singapore Default Rule',
        description: 'Default rule for Amex Platinum Singapore card',
        cardType: 'AmexPlatinumSingapore',
        enabled: true,
        rounding: 'nearest',
        basePointRate: 1.25,
        bonusPointRate: 0,
        monthlyCap: 0,
        isOnlineOnly: false,
        isContactlessOnly: false,
        includedMCCs: [],
        excludedMCCs: [],
        pointsCurrency: 'MR (Charge Card)'
      },
      {
        id: 'amex-platinum-credit-default',
        name: 'Amex Platinum Credit Default Rule',
        description: 'Default rule for Amex Platinum Credit card',
        cardType: 'AmexPlatinumCredit',
        enabled: true,
        rounding: 'nearest',
        basePointRate: 1.25,
        bonusPointRate: 0,
        monthlyCap: 0,
        isOnlineOnly: false,
        isContactlessOnly: false,
        includedMCCs: [],
        excludedMCCs: [],
        pointsCurrency: 'MR (Credit Card)'
      },
      {
        id: 'amex-platinum-canada-default',
        name: 'Amex Platinum Canada Default Rule',
        description: 'Default rule for Amex Platinum Canada card',
        cardType: 'AmexPlatinumCanada',
        enabled: true,
        rounding: 'nearest',
        basePointRate: 1,
        bonusPointRate: 0,
        monthlyCap: 0,
        isOnlineOnly: false,
        isContactlessOnly: false,
        includedMCCs: [],
        excludedMCCs: [],
        pointsCurrency: 'MR'
      },
      {
        id: 'amex-cobalt-default',
        name: 'Amex Cobalt Default Rule',
        description: 'Default rule for Amex Cobalt card',
        cardType: 'AmexCobalt',
        enabled: true,
        rounding: 'nearest',
        basePointRate: 1,
        bonusPointRate: 0,
        monthlyCap: 0,
        isOnlineOnly: false,
        isContactlessOnly: false,
        includedMCCs: [],
        excludedMCCs: [],
        pointsCurrency: 'MR'
      },
      {
        id: 'td-aeroplan-visa-infinite-default',
        name: 'TD Aeroplan Visa Infinite Default Rule',
        description: 'Default rule for TD Aeroplan Visa Infinite card',
        cardType: 'TDAeroplanVisaInfinite',
        enabled: true,
        rounding: 'nearest',
        basePointRate: 1,
        bonusPointRate: 0.5,
        monthlyCap: 0,
        isOnlineOnly: false,
        isContactlessOnly: false,
        includedMCCs: ['5541', '5542', '5411', '5422', '5441', '5451', '5462'],
        excludedMCCs: [],
        pointsCurrency: 'Aeroplan'
      },
      {
        id: 'uob-ladys-solitaire-default',
        name: 'UOB Lady\'s Solitaire Default Rule',
        description: 'Default rule for UOB Lady\'s Solitaire card',
        cardType: 'UOBLadysSolitaire',
        enabled: true,
        rounding: 'nearest5',
        basePointRate: 0.4,
        bonusPointRate: 3.6,
        monthlyCap: 7200,
        isOnlineOnly: false,
        isContactlessOnly: false,
        includedMCCs: [],
        excludedMCCs: [],
        pointsCurrency: 'UNI$',
        customParams: {
          categorySelection: true,
          maxCategories: 2
        }
      }
    ];
    
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
        custom_params: {
          ...rule.customParams,
          pointsCurrency: rule.pointsCurrency
        }
      };
      
      const { error } = await supabase
        .from('card_rules')
        .upsert(dbRule);
        
      if (error) {
        console.error('Error saving rule to database:', error);
        this.rules.set(rule.id, rule);
        return false;
      }
      
      this.rules.set(rule.id, rule);
      console.log(`Rule ${rule.id} saved successfully`);
      return true;
    } catch (error) {
      console.error('Error in saveRule:', error);
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
    
    if (!rule.id) errors.push('Rule ID is required');
    if (!rule.name) errors.push('Rule name is required');
    if (!rule.cardType) errors.push('Card type is required');
    
    if (rule.basePointRate < 0) errors.push('Base point rate cannot be negative');
    if (rule.bonusPointRate < 0) errors.push('Bonus point rate cannot be negative');
    
    if (rule.monthlyCap < 0) errors.push('Monthly cap cannot be negative');
    
    const conflictingMCCs = rule.includedMCCs.filter(mcc => 
      rule.excludedMCCs.includes(mcc)
    );
    
    if (conflictingMCCs.length > 0) {
      errors.push(`MCCs cannot be both included and excluded: ${conflictingMCCs.join(', ')}`);
    }
    
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
      const { error } = await supabase
        .from('card_rules')
        .delete()
        .match({ id: ruleId });
        
      if (error) {
        console.error('Error deleting rule from database:', error);
        return false;
      }
      
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
    
    if (config.isOnlineOnly) {
      rules.push(RewardRuleFactory.createOnlineTransactionRule());
    }
    
    if (config.isContactlessOnly) {
      rules.push(RewardRuleFactory.createContactlessTransactionRule());
    }
    
    if (config.includedMCCs.length > 0) {
      rules.push(RewardRuleFactory.createMCCInclusionRule(config.includedMCCs));
    }
    
    if (config.excludedMCCs.length > 0) {
      rules.push(RewardRuleFactory.createMCCExclusionRule(config.excludedMCCs));
    }
    
    if (rules.length > 1) {
      return [RewardRuleFactory.createAnyRule(rules)];
    }
    
    return rules;
  }
}

export const cardRuleService = new CardRuleService();
