
import { SupabaseClient } from '@supabase/supabase-js';
import { RewardRule, DbRewardRule } from './types';
import { RuleMapper } from './RuleMapper';
import { Database } from '@/types/supabase';

export class RuleRepository {
  private supabase: SupabaseClient<Database>;
  private static instance: RuleRepository;
  private readOnly: boolean = false;
  private ruleMapper: RuleMapper;

  private constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
    this.ruleMapper = new RuleMapper();
  }

  public static getInstance(supabaseClient?: SupabaseClient<Database>): RuleRepository {
    if (!RuleRepository.instance && supabaseClient) {
      RuleRepository.instance = new RuleRepository(supabaseClient);
    } else if (!RuleRepository.instance && !supabaseClient) {
      throw new Error('Supabase client must be provided to create the first instance.');
    }
    return RuleRepository.instance;
  }

  setReadOnly(readOnly: boolean): void {
    this.readOnly = readOnly;
  }

  async getRulesForCardType(cardTypeId: string): Promise<RewardRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('reward_rules')
        .select('*')
        .eq('card_type_id', cardTypeId);

      if (error) throw error;

      return data.map(dbRule => this.ruleMapper.mapDbRuleToRewardRule(dbRule));
    } catch (error) {
      console.error('Error fetching rules:', error);
      return [];
    }
  }

  async updateRule(rule: RewardRule): Promise<void> {
    if (this.readOnly) {
      console.log('Read-only mode: Skipping rule update');
      return;
    }

    try {
      const dbRule = this.ruleMapper.mapRewardRuleToDbRule(rule);
      
      const { error } = await this.supabase
        .from('reward_rules')
        .update({
          ...dbRule,
          updated_at: new Date().toISOString()
        })
        .eq('id', rule.id);

      if (error) throw error;
      
      console.log('Rule updated successfully:', rule.id);
    } catch (error) {
      console.error('Error updating rule:', error);
      throw error;
    }
  }

  async createRule(ruleData: Omit<RewardRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RewardRule> {
    if (this.readOnly) {
      console.log('Read-only mode: Skipping rule creation');
      // Return a mock rule for read-only mode
      return {
        ...ruleData,
        id: `mock-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    try {
      const newRule: RewardRule = {
        ...ruleData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dbRule = this.ruleMapper.mapRewardRuleToDbRule(newRule);
      
      const { error } = await this.supabase
        .from('reward_rules')
        .insert([{
          ...dbRule,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;
      
      console.log('Rule created successfully:', newRule.id);
      return newRule;
    } catch (error) {
      console.error('Error creating rule:', error);
      throw error;
    }
  }

  async deleteRule(ruleId: string): Promise<void> {
    if (this.readOnly) {
      console.log('Read-only mode: Skipping rule deletion');
      return;
    }

    try {
      const { error } = await this.supabase
        .from('reward_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      
      console.log('Rule deleted successfully:', ruleId);
    } catch (error) {
      console.error('Error deleting rule:', error);
      throw error;
    }
  }
}

// Singleton instance
let ruleRepositoryInstance: RuleRepository | null = null;

export const initializeRuleRepository = (supabaseClient: SupabaseClient<Database>): RuleRepository => {
  if (!ruleRepositoryInstance) {
    ruleRepositoryInstance = RuleRepository.getInstance(supabaseClient);
  }
  return ruleRepositoryInstance;
};

export const getRuleRepository = (): RuleRepository => {
  if (!ruleRepositoryInstance) {
    throw new Error('Rule repository has not been initialized. Call initializeRuleRepository first.');
  }
  return ruleRepositoryInstance;
};
