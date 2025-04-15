// tests/RuleRepository.test.ts
import { RuleRepository } from '../src/core/rewards/RuleRepository';
import { mapDbRuleToRewardRule } from '../src/core/rewards/RuleMapper';
import { SupabaseClient } from '@supabase/supabase-js';
import { DbRewardRule } from '../src/core/rewards/types';
import { DateTime } from 'luxon';

const mockRules: DbRewardRule[] = [
  {
    id: 'mock-id',
    card_type_id: 'DBS',
    name: 'Test Rule',
    enabled: true,
    description: 'Test',
    conditions: '[]',
    bonus_tiers: '[]',
    calculation_method: 'standard',
    base_multiplier: 1,
    bonus_multiplier: 1,
    points_rounding_strategy: 'floor',
    amount_rounding_strategy: 'floor',
    block_size: 1,
    points_currency: 'Points',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// ✅ mock Supabase client
export function createMockSupabaseClient(data: DbRewardRule[]): SupabaseClient {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() =>
        // THIS is what loadRules() expects directly
        Promise.resolve({ data, error: null })
      ),
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: data[0], error: null }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  } as unknown as SupabaseClient;
}

describe('RuleRepository', () => {
  let repo: RuleRepository;

  beforeEach(() => {
    const supabase = createMockSupabaseClient(mockRules);
    repo = new RuleRepository(supabase);
  });

  it('loads all rules from Supabase', async () => {
    const rules = await repo.loadRules();
    expect(rules.length).toBe(1);
    expect(rules[0].id).toBe('mock-id');
    expect(rules[0].reward.calculationMethod).toBe('standard');
  });

  it('gets rules for card type from cache after load', async () => {
    await repo.loadRules();
    const rules = await repo.getRulesForCardType('DBS');
    expect(rules.length).toBe(1);
  });

  it('gets rule by ID after caching', async () => {
    await repo.loadRules();
    const rule = await repo.getRule('mock-id');
    expect(rule?.cardTypeId).toBe('DBS');
  });

  it('saves a rule and updates cache', async () => {
    const rules = await repo.loadRules();
    const saved = await repo.saveRule(mapDbRuleToRewardRule(mockRules[0]));
    expect(saved?.id).toBe('mock-id');
  });

  it('deletes a rule and removes from cache', async () => {
    await repo.loadRules();
    const deleted = await repo.deleteRule('mock-id');
    expect(deleted).toBe(true);
  });

  it('respects read-only mode on save/delete', async () => {
    await repo.loadRules();
    repo.setReadOnly(true);
    const saved = await repo.saveRule(mockRules[0] as any);
    const deleted = await repo.deleteRule('mock-id');
    expect(saved).toBeNull();
    expect(deleted).toBe(false);
  });
});
