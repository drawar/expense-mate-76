
import { RewardRule } from './types';
import { SupabaseClient } from '@supabase/supabase-js';
import { RuleMapper } from './RuleMapper';
import { DEFAULT_CACHE_TTL_MS } from './constants';
import { supabase } from '@/integrations/supabase/client';

/**
 * A repository for managing reward rules from Supabase.
 * Supports loading, caching, and basic CRUD operations.
 */
export class RuleRepository {
  private static instance: RuleRepository;
  private rules = new Map<string, RewardRule>(); // in-memory cache by rule ID
  private rulesByCardType = new Map<string, RewardRule[]>(); // secondary index for looking up rules by card type
  private lastRuleLoadTime = 0; // timestamp for when rules were last refreshed
  private readonly = false; // prevents saving/deleting in production scenarios like expense submission.

  /**
   * A repository for managing reward rules from Supabase.
   * Supports loading, caching, and basic CRUD operations.
   */
  private constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Get the singleton instance of RuleRepository
   */
  public static getInstance(): RuleRepository {
    if (!RuleRepository.instance) {
      RuleRepository.instance = new RuleRepository(supabase);
    }
    return RuleRepository.instance;
  }

  /**
   * Enables or disables read-only mode.
   * In read-only mode, mutations like save/delete are blocked.
   * @param readOnly A boolean flag to toggle read-only mode.
   */ 
  public setReadOnly(readOnly: boolean): void {
    this.readonly = readOnly;
    console.log(`RuleRepository: Read-only mode ${readOnly ? 'enabled' : 'disabled'}`);
  }

  /**
   * Determines if the cache for a specific card type is stale.
   * @param cardTypeId The card type identifier to check.
   * @returns True if the cache is expired or missing for the card.
   */
  private isCacheStaleForCard(cardTypeId: string): boolean {
    return Date.now() - this.lastRuleLoadTime > DEFAULT_CACHE_TTL_MS || !this.rulesByCardType.has(cardTypeId);
  }

  /**
   * Loads all rules from the database and updates the cache.
   * @returns A promise that resolves to a list of all reward rules.
   */
  public async loadRules(): Promise<RewardRule[]> {
    try {
      const { data, error } = await this.supabase.from('reward_rules').select('*');
      if (error || !Array.isArray(data)) {
        console.error('Error loading rules:', error);
        console.log('[DEBUG] data from supabase:', data);
        return [];
      }

      const rules = data.map(RuleMapper.fromDatabase);
      this.lastRuleLoadTime = Date.now();
      this.rules.clear();
      this.rulesByCardType.clear();

      for (const rule of rules) {
        this.rules.set(rule.id, rule);
        if (!this.rulesByCardType.has(rule.cardTypeId)) {
          this.rulesByCardType.set(rule.cardTypeId, []);
        }
        this.rulesByCardType.get(rule.cardTypeId)?.push(rule);
      }

      return rules;
    } catch (err) {
      console.error('Unexpected error in loadRules:', err);
      return [];
    }
  }

  /**
   * Retrieves reward rules associated with a specific card type.
   * Uses cached rules if valid; otherwise, fetches from Supabase.
   * @param cardTypeId The card type ID to filter by.
   * @returns A promise that resolves to a list of reward rules for the card.
   */
  public async getRulesForCardType(cardTypeId: string): Promise<RewardRule[]> {
    if (this.isCacheStaleForCard(cardTypeId)) {
      await this.loadRules();
    }

    if (this.rulesByCardType.has(cardTypeId)) {
      return this.rulesByCardType.get(cardTypeId) || [];
    }

    try {
      const { data, error } = await this.supabase
        .from('reward_rules')
        .select('*')
        .eq('card_type_id', cardTypeId)
        .eq('enabled', true);

      if (error || !data?.length) {
        console.warn(`No rules found for cardTypeId=${cardTypeId}`, error);
        return [];
      }

      const rules = data.map(RuleMapper.fromDatabase);
      this.rulesByCardType.set(cardTypeId, rules);
      rules.forEach(r => this.rules.set(r.id, r));
      return rules;
    } catch (err) {
      console.error('Unexpected error in getRulesForCardType:', err);
      return [];
    }
  }

  /**
   * Fetches a single reward rule by its ID.
   * Uses cache if available, otherwise queries Supabase.
   * @param id The unique ID of the reward rule.
   * @returns A promise that resolves to the reward rule or null if not found.
   */
  public async getRule(id: string): Promise<RewardRule | null> {
    if (this.rules.has(id)) return this.rules.get(id)!;

    try {
      const { data, error } = await this.supabase
        .from('reward_rules')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.warn(`Rule not found: ${id}`, error);
        return null;
      }

      const rule = RuleMapper.fromDatabase(data);
      this.rules.set(rule.id, rule);
      if (!this.rulesByCardType.has(rule.cardTypeId)) {
        this.rulesByCardType.set(rule.cardTypeId, []);
      }
      this.rulesByCardType.get(rule.cardTypeId)?.push(rule);

      return rule;
    } catch (err) {
      console.error('Unexpected error in getRule:', err);
      return null;
    }
  }

  /**
   * Saves or updates a reward rule in Supabase.
   * Caches the result and updates the rule group by card type.
   * Fails silently if repository is in read-only mode.
   * @param rule The reward rule to save.
   * @returns A promise that resolves to the saved rule, or null if failed.
   */
  public async saveRule(rule: RewardRule): Promise<RewardRule | null> {
    if (this.readonly) {
      console.warn('RuleRepository: Cannot save rule in read-only mode');
      return null;
    }

    try {
      const dbRule = RuleMapper.toDatabase(rule);
      const { data, error } = await this.supabase
        .from('reward_rules')
        .upsert(dbRule)
        .select()
        .single();

      if (error || !data) {
        console.error('Error saving rule:', error);
        return null;
      }

      const savedRule = RuleMapper.fromDatabase(data);
      this.rules.set(savedRule.id, savedRule);

      const cardRules = this.rulesByCardType.get(savedRule.cardTypeId) || [];
      const existingIndex = cardRules.findIndex(r => r.id === savedRule.id);
      if (existingIndex >= 0) cardRules[existingIndex] = savedRule;
      else cardRules.push(savedRule);
      this.rulesByCardType.set(savedRule.cardTypeId, cardRules);

      return savedRule;
    } catch (err) {
      console.error('Unexpected error in saveRule:', err);
      return null;
    }
  }

  /**
   * Deletes a reward rule by ID from Supabase and the in-memory cache.
   * Fails silently if repository is in read-only mode.
   * @param id The ID of the rule to delete.
   * @returns A promise that resolves to true if deleted, false if failed.
   */
  public async deleteRule(id: string): Promise<boolean> {
    if (this.readonly) {
      console.warn('RuleRepository: Cannot delete rule in read-only mode');
      return false;
    }

    try {
      const { error } = await this.supabase.from('reward_rules').delete().eq('id', id);
      if (error) {
        console.error('Error deleting rule:', error);
        return false;
      }

      const rule = this.rules.get(id);
      this.rules.delete(id);

      if (rule) {
        const cardRules = this.rulesByCardType.get(rule.cardTypeId) || [];
        this.rulesByCardType.set(rule.cardTypeId, cardRules.filter(r => r.id !== id));
      }

      return true;
    } catch (err) {
      console.error('Unexpected error in deleteRule:', err);
      return false;
    }
  }
}
