// services/rewards/RuleRepository.ts

import { RewardRule, BonusTier } from './types';
import { BaseService } from '../core/BaseService';

/**
 * Repository for storing and retrieving reward rules
 */
export class RuleRepository extends BaseService {
  private static _instance: RuleRepository;
  
  // Cache with 15-minute expiration
  private rulesCache = this.createCache<RewardRule>();
  private rulesByCardTypeCache = this.createCache<RewardRule[]>();
  
  private constructor() {
    super();
  }
  
  // Helper method to check if a cardTypeId is likely for a cash payment method
  private isCashPaymentMethod(cardTypeId: string): boolean {
    // Check if cardTypeId is a UUID (which indicates it's a cash payment method)
    // UUID format: 8-4-4-4-12 characters (36 total with hyphens)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidPattern.test(cardTypeId);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RuleRepository {
    if (!this._instance) {
      this._instance = new RuleRepository();
    }
    return this._instance;
  }
  
  /**
   * Load all rules from the database
   */
  public async loadRules(): Promise<RewardRule[]> {
    try {
      const { data, error } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('reward_rules')
            .select('*');
        }
      );
        
      if (error || !data) {
        console.error('Error loading rules:', error);
        return [];
      }
      
      const rules: RewardRule[] = data.map(this.mapDbRuleToRewardRule);
      
      // Store rules in memory
      rules.forEach(rule => {
        this.rulesCache.set(rule.id, rule);
        
        // Group by card type
        const cardTypeRules = this.rulesByCardTypeCache.get(rule.cardTypeId) || [];
        this.rulesByCardTypeCache.set(rule.cardTypeId, [...cardTypeRules, rule]);
      });
      
      return rules;
    } catch (error) {
      console.error('Error loading rules:', error);
      return [];
    }
  }
  
  /**
   * Get rules for a specific card type
   */
  public async getRulesForCardType(cardTypeId: string): Promise<RewardRule[]> {
    // Check if this is a cash payment method, return empty array if so
    if (this.isCashPaymentMethod(cardTypeId)) {
      console.log(`Skipping rules query for cash payment method: ${cardTypeId}`);
      return [];
    }
    
    // Check cache first
    const cached = this.rulesByCardTypeCache.get(cardTypeId);
    if (cached) {
      return cached;
    }
    
    try {
      // Query Supabase reward_rules table
      const { data, error } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('reward_rules')
            .select('*')
            .eq('card_type_id', cardTypeId)
            .eq('enabled', true);
        }
      );
        
      if (error || !data) {
        console.error('Error loading rules for card type:', error);
        return [];
      }
      
      if (data.length === 0) {
        console.log(`No rules found in Supabase for card type ${cardTypeId}`);
        return [];
      }
      
      console.log(`Loaded ${data.length} rules from Supabase for card type ${cardTypeId}`);
      
      const rules: RewardRule[] = data.map(this.mapDbRuleToRewardRule);
      
      // Cache results
      this.rulesByCardTypeCache.set(cardTypeId, rules);
      rules.forEach(rule => this.rulesCache.set(rule.id, rule));
      
      return rules;
    } catch (error) {
      console.error('Error loading rules for card type:', error);
      return [];
    }
  }
  
  /**
   * Get a rule by ID
   */
  public async getRule(id: string): Promise<RewardRule | null> {
    // Check cache first
    const cached = this.rulesCache.get(id);
    if (cached) {
      return cached;
    }
    
    try {
      const { data, error } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('reward_rules')
            .select('*')
            .eq('id', id)
            .single();
        }
      );
        
      if (error || !data) {
        console.error('Error loading rule:', error);
        return null;
      }
      
      const rule = this.mapDbRuleToRewardRule(data);
      
      // Cache the result
      this.rulesCache.set(rule.id, rule);
      
      // Add to card type mapping
      const cardTypeRules = this.rulesByCardTypeCache.get(rule.cardTypeId) || [];
      this.rulesByCardTypeCache.set(rule.cardTypeId, [...cardTypeRules, rule]);
      
      return rule;
    } catch (error) {
      console.error('Error loading rule:', error);
      return null;
    }
  }
  
  /**
   * Save a rule
   */
  public async saveRule(rule: RewardRule): Promise<RewardRule | null> {
    try {
      const dbRule = this.mapRewardRuleToDbRule(rule);
      
      const { data, error } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('reward_rules')
            .upsert(dbRule)
            .select()
            .single();
        }
      );
        
      if (error || !data) {
        console.error('Error saving rule:', error);
        return null;
      }
      
      const savedRule = this.mapDbRuleToRewardRule(data);
      
      // Update cache
      this.rulesCache.set(savedRule.id, savedRule);
      
      // Update card type mapping
      const cardTypeRules = this.rulesByCardTypeCache.get(savedRule.cardTypeId) || [];
      const existingIndex = cardTypeRules.findIndex(r => r.id === savedRule.id);
      
      if (existingIndex >= 0) {
        cardTypeRules[existingIndex] = savedRule;
        this.rulesByCardTypeCache.set(savedRule.cardTypeId, [...cardTypeRules]);
      } else {
        this.rulesByCardTypeCache.set(savedRule.cardTypeId, [...cardTypeRules, savedRule]);
      }
      
      return savedRule;
    } catch (error) {
      console.error('Error saving rule:', error);
      return null;
    }
  }
  
  /**
   * Delete a rule
   */
  public async deleteRule(id: string): Promise<boolean> {
    try {
      // Get rule from cache first to have its cardTypeId for cache invalidation
      const rule = this.rulesCache.get(id);
      
      const { error } = await this.safeDbOperation(
        async () => {
          return await this.supabase
            .from('reward_rules')
            .delete()
            .eq('id', id);
        }
      );
        
      if (error) {
        console.error('Error deleting rule:', error);
        return false;
      }
      
      // Remove from cache
      this.rulesCache.delete(id);
      
      // Remove from card type mapping if we have the cardTypeId
      if (rule) {
        const cardTypeRules = this.rulesByCardTypeCache.get(rule.cardTypeId) || [];
        this.rulesByCardTypeCache.set(
          rule.cardTypeId,
          cardTypeRules.filter(r => r.id !== id)
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting rule:', error);
      return false;
    }
  }
  
  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.rulesCache.clear();
    this.rulesByCardTypeCache.clear();
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
      // Pass conditions directly as an object instead of stringifying it
      conditions: rule.conditions,
      calculation_method: rule.reward.calculationMethod,
      base_multiplier: rule.reward.baseMultiplier,
      bonus_multiplier: rule.reward.bonusMultiplier,
      points_rounding_strategy: rule.reward.pointsRoundingStrategy,
      amount_rounding_strategy: rule.reward.amountRoundingStrategy,
      block_size: rule.reward.blockSize,
      // Pass bonus_tiers directly as an object instead of stringifying it
      bonus_tiers: rule.reward.bonusTiers || null,
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
