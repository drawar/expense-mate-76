
// services/rewards/RuleRepository.ts

import { RewardRule, BonusTier } from './types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Repository for storing and retrieving reward rules
 */
export class RuleRepository {
  private static instance: RuleRepository;
  private rules: Map<string, RewardRule> = new Map();
  private rulesByCardType: Map<string, RewardRule[]> = new Map();
  private lastRuleLoadTime: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): RuleRepository {
    if (!RuleRepository.instance) {
      RuleRepository.instance = new RuleRepository();
    }
    return RuleRepository.instance;
  }
  
  /**
   * Load all rules from the database
   */
  public async loadRules(): Promise<RewardRule[]> {
    try {
      console.log('RuleRepository: Loading all rules from database...');
      const { data, error } = await supabase
        .from('reward_rules')
        .select('*');
        
      if (error) {
        console.error('Error loading rules:', error);
        return [];
      }
      
      console.log(`RuleRepository: Loaded ${data.length} rules from database`);
      
      const rules: RewardRule[] = data.map(this.mapDbRuleToRewardRule);
      
      // Store rules in memory
      this.rules.clear();
      this.rulesByCardType.clear();
      this.lastRuleLoadTime = Date.now();
      
      rules.forEach(rule => {
        this.rules.set(rule.id, rule);
        
        // Group by card type
        if (!this.rulesByCardType.has(rule.cardTypeId)) {
          this.rulesByCardType.set(rule.cardTypeId, []);
        }
        
        this.rulesByCardType.get(rule.cardTypeId)?.push(rule);
      });
      
      return rules;
    } catch (error) {
      console.error('Error loading rules:', error);
      return [];
    }
  }
  
  /**
   * Get rules for a specific card type - READ ONLY operation
   * This is used during expense submission to calculate points
   */
  public async getRulesForCardType(cardTypeId: string): Promise<RewardRule[]> {
    // Check if cache is expired
    const isCacheExpired = Date.now() - this.lastRuleLoadTime > this.CACHE_TTL;
    
    // If cache is expired or we don't have rules for this card type, reload from database
    if (isCacheExpired || !this.rulesByCardType.has(cardTypeId)) {
      console.log('RuleRepository: Cache expired or no rules for card type, reloading...');
      await this.loadRules();
    }
    
    // Check cache first
    if (this.rulesByCardType.has(cardTypeId)) {
      return this.rulesByCardType.get(cardTypeId) || [];
    }
    
    try {
      // Query Supabase reward_rules table
      console.log(`RuleRepository: Querying database for rules with card_type_id=${cardTypeId}`);
      const { data, error } = await supabase
        .from('reward_rules')
        .select('*')
        .eq('card_type_id', cardTypeId)
        .eq('enabled', true);
        
      if (error) {
        console.error('Error loading rules for card type:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log(`No rules found in Supabase for card type ${cardTypeId}`);
        return [];
      }
      
      console.log(`Loaded ${data.length} rules from Supabase for card type ${cardTypeId}`);
      
      const rules: RewardRule[] = data.map(this.mapDbRuleToRewardRule);
      
      // Cache results
      this.rulesByCardType.set(cardTypeId, rules);
      rules.forEach(rule => this.rules.set(rule.id, rule));
      
      return rules;
    } catch (error) {
      console.error('Error loading rules for card type:', error);
      return [];
    }
  }
  
  /**
   * Get a rule by ID - READ ONLY operation
   */
  public async getRule(id: string): Promise<RewardRule | null> {
    // Check cache first
    if (this.rules.has(id)) {
      return this.rules.get(id) || null;
    }
    
    try {
      console.log(`RuleRepository: Fetching rule with id=${id}`);
      const { data, error } = await supabase
        .from('reward_rules')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error || !data) {
        console.error('Error loading rule:', error);
        return null;
      }
      
      const rule = this.mapDbRuleToRewardRule(data);
      
      // Cache the result
      this.rules.set(rule.id, rule);
      
      // Add to card type mapping
      if (!this.rulesByCardType.has(rule.cardTypeId)) {
        this.rulesByCardType.set(rule.cardTypeId, []);
      }
      this.rulesByCardType.get(rule.cardTypeId)?.push(rule);
      
      return rule;
    } catch (error) {
      console.error('Error loading rule:', error);
      return null;
    }
  }
  
  /**
   * Save a rule - ADMIN OPERATION
   * This should only be used in the reward rule editor, not during expense submission
   */
  public async saveRule(rule: RewardRule): Promise<RewardRule | null> {
    try {
      console.log('RuleRepository: Saving rule...', rule.id);
      const dbRule = this.mapRewardRuleToDbRule(rule);
      
      const { data, error } = await supabase
        .from('reward_rules')
        .upsert(dbRule)
        .select()
        .single();
        
      if (error) {
        console.error('Error saving rule:', error);
        return null;
      }
      
      const savedRule = this.mapDbRuleToRewardRule(data);
      
      // Update cache
      this.rules.set(savedRule.id, savedRule);
      
      // Update card type mapping
      if (!this.rulesByCardType.has(savedRule.cardTypeId)) {
        this.rulesByCardType.set(savedRule.cardTypeId, []);
      }
      
      const cardRules = this.rulesByCardType.get(savedRule.cardTypeId) || [];
      const existingIndex = cardRules.findIndex(r => r.id === savedRule.id);
      
      if (existingIndex >= 0) {
        cardRules[existingIndex] = savedRule;
      } else {
        cardRules.push(savedRule);
      }
      
      this.rulesByCardType.set(savedRule.cardTypeId, cardRules);
      
      return savedRule;
    } catch (error) {
      console.error('Error saving rule:', error);
      return null;
    }
  }
  
  /**
   * Delete a rule - ADMIN OPERATION
   * This should only be used in the reward rule editor, not during expense submission
   */
  public async deleteRule(id: string): Promise<boolean> {
    try {
      console.log(`RuleRepository: Deleting rule with id=${id}`);
      const { error } = await supabase
        .from('reward_rules')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting rule:', error);
        return false;
      }
      
      // Get rule from cache to get its card type
      const rule = this.rules.get(id);
      
      // Remove from cache
      this.rules.delete(id);
      
      // Remove from card type mapping
      if (rule) {
        const cardRules = this.rulesByCardType.get(rule.cardTypeId) || [];
        this.rulesByCardType.set(
          rule.cardTypeId,
          cardRules.filter(r => r.id !== id)
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting rule:', error);
      return false;
    }
  }
  
  /**
   * Map database rule to RewardRule
   */
  private mapDbRuleToRewardRule(dbRule: any): RewardRule {
    // Parse JSON fields
    const conditions = typeof dbRule.conditions === 'string' ? 
      JSON.parse(dbRule.conditions) : dbRule.conditions || [];
    
    // Parse bonus tiers if present
    let bonusTiers: BonusTier[] | undefined;
    if (dbRule.bonus_tiers) {
      try {
        bonusTiers = typeof dbRule.bonus_tiers === 'string' ?
          JSON.parse(dbRule.bonus_tiers) : dbRule.bonus_tiers;
        
        // Make sure compound conditions are properly parsed
        if (bonusTiers) {
          bonusTiers = bonusTiers.map((tier: any) => {
            // If it's a compound condition, ensure subConditions are properly formatted
            if (tier.condition?.type === 'compound' && typeof tier.condition.subConditions === 'string') {
              tier.condition.subConditions = JSON.parse(tier.condition.subConditions);
            }
            return tier;
          });
        }
      } catch (e) {
        console.error('Error parsing bonus tiers:', e);
      }
    }
    
    return {
      id: dbRule.id,
      cardTypeId: dbRule.card_type_id,
      name: dbRule.name,
      description: dbRule.description || '',
      enabled: dbRule.enabled,
      priority: dbRule.priority || 0,
      conditions,
      reward: {
        calculationMethod: dbRule.calculation_method || 'standard',
        baseMultiplier: dbRule.base_multiplier || 0,
        bonusMultiplier: dbRule.bonus_multiplier || 0,
        pointsRoundingStrategy: dbRule.points_rounding_strategy || 'floor',
        amountRoundingStrategy: dbRule.amount_rounding_strategy || 'floor',
        blockSize: dbRule.block_size || 1,
        bonusTiers,
        monthlyCap: dbRule.monthly_cap,
        monthlyMinSpend: dbRule.monthly_min_spend,
        monthlySpendPeriodType: dbRule.monthly_spend_period_type,
        pointsCurrency: dbRule.points_currency || 'Points'
      },
      createdAt: new Date(dbRule.created_at),
      updatedAt: new Date(dbRule.updated_at || dbRule.created_at)
    };
  }
  
  /**
   * Map RewardRule to database rule
   */
  private mapRewardRuleToDbRule(rule: RewardRule): any {
    return {
      id: rule.id,
      card_type_id: rule.cardTypeId,
      name: rule.name,
      description: rule.description,
      enabled: rule.enabled,
      priority: rule.priority,
      conditions: JSON.stringify(rule.conditions),
      calculation_method: rule.reward.calculationMethod,
      base_multiplier: rule.reward.baseMultiplier,
      bonus_multiplier: rule.reward.bonusMultiplier,
      points_rounding_strategy: rule.reward.pointsRoundingStrategy,
      amount_rounding_strategy: rule.reward.amountRoundingStrategy,
      block_size: rule.reward.blockSize,
      bonus_tiers: rule.reward.bonusTiers ? JSON.stringify(rule.reward.bonusTiers) : null,
      monthly_cap: rule.reward.monthlyCap,
      monthly_min_spend: rule.reward.monthlyMinSpend,
      monthly_spend_period_type: rule.reward.monthlySpendPeriodType,
      points_currency: rule.reward.pointsCurrency,
      created_at: rule.createdAt.toISOString(),
      updated_at: rule.updatedAt.toISOString()
    };
  }
}

// Export a singleton instance
export const ruleRepository = RuleRepository.getInstance();
