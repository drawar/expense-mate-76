// tests/RuleRepository.test.ts
import { RuleRepository } from "../src/core/rewards/RuleRepository";
import { RuleMapper } from "../src/core/rewards/RuleMapper";
import { SupabaseClient } from "@supabase/supabase-js";
import { DbRewardRule } from "../src/core/rewards/types";

const mockRules: DbRewardRule[] = [
  {
    id: "mock-id",
    card_type_id: "DBS",
    name: "Test Rule",
    enabled: true,
    description: "Test",
    priority: 0,
    conditions: "[]",
    bonus_tiers: "[]",
    calculation_method: "standard",
    base_multiplier: 1,
    bonus_multiplier: 1,
    points_rounding_strategy: "floor",
    amount_rounding_strategy: "floor",
    block_size: 1,
    monthly_cap: null,
    monthly_min_spend: null,
    monthly_spend_period_type: null,
    points_currency: "Points",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ✅ mock Supabase client
export function createMockSupabaseClient(data: DbRewardRule[]): SupabaseClient {
  return {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data, error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() =>
          Promise.resolve({ data: [data[0]], error: null })
        ),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() =>
            Promise.resolve({ data: [data[0]], error: null })
          ),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() =>
            Promise.resolve({ data: [data[0]], error: null })
          ),
        })),
      })),
    })),
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({
          data: {
            session: {
              user: { id: "test-user-id" },
            },
          },
          error: null,
        })
      ),
    },
  } as unknown as SupabaseClient;
}

describe("RuleRepository", () => {
  let repo: RuleRepository;
  let mapper: RuleMapper;

  beforeEach(() => {
    // Reset singleton before each test
    RuleRepository["resetInstance"]();
    const supabase = createMockSupabaseClient(mockRules);
    repo = RuleRepository["setInstance"](supabase);
    mapper = new RuleMapper();
  });

  it("gets rules for card type from Supabase", async () => {
    const rules = await repo.getRulesForCardType("DBS");
    expect(rules.length).toBe(1);
    expect(rules[0].id).toBe("mock-id");
    expect(rules[0].reward.calculationMethod).toBe("standard");
  });

  it("creates a new rule", async () => {
    const newRule = mapper.mapDbRuleToRewardRule(mockRules[0]);
    const { id, createdAt, updatedAt, ...ruleData } = newRule;
    const created = await repo.createRule(ruleData);
    expect(created.name).toBe("Test Rule");
    expect(created.cardTypeId).toBe("DBS");
  });

  it("updates an existing rule", async () => {
    const rule = mapper.mapDbRuleToRewardRule(mockRules[0]);
    await expect(repo.updateRule(rule)).resolves.not.toThrow();
  });

  it("deletes a rule", async () => {
    await expect(repo.deleteRule("mock-id")).resolves.not.toThrow();
  });

  it("verifies Supabase client is initialized", () => {
    expect(repo.isSupabaseClientInitialized()).toBe(true);
  });
});
