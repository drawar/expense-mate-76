/**
 * Property-Based Tests for Reward Rule Persistence
 *
 * **Feature: codebase-improvements, Property 1: Reward rule persistence round-trip**
 * **Validates: Requirements 1.2, 1.3, 1.5**
 */

import fc from "fast-check";
import {
  RuleRepository,
  initializeRuleRepository,
} from "../src/core/rewards/RuleRepository";
import {
  RewardRule,
  RuleCondition,
  BonusTier,
} from "../src/core/rewards/types";
import { SupabaseClient } from "@supabase/supabase-js";

// Arbitraries for generating random test data

const ruleConditionArbitrary = (): fc.Arbitrary<RuleCondition> => {
  return fc.record({
    type: fc.constantFrom(
      "mcc",
      "transaction_type",
      "currency",
      "merchant",
      "amount",
      "category"
    ),
    operation: fc.constantFrom(
      "include",
      "exclude",
      "equals",
      "greater_than",
      "less_than",
      "range"
    ),
    values: fc.array(fc.oneof(fc.string(), fc.integer()), {
      minLength: 1,
      maxLength: 5,
    }),
    displayName: fc.option(fc.string(), { nil: undefined }),
  });
};

const bonusTierArbitrary = (): fc.Arbitrary<BonusTier> => {
  return fc.record({
    minAmount: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), {
      nil: undefined,
    }),
    maxAmount: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), {
      nil: undefined,
    }),
    minSpend: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), {
      nil: undefined,
    }),
    maxSpend: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), {
      nil: undefined,
    }),
    multiplier: fc.double({ min: 0.1, max: 10, noNaN: true }),
    description: fc.option(fc.string(), { nil: undefined }),
    name: fc.option(fc.string(), { nil: undefined }),
    priority: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
  });
};

const rewardRuleDataArbitrary = (): fc.Arbitrary<
  Omit<RewardRule, "id" | "createdAt" | "updatedAt">
> => {
  return fc.record({
    cardTypeId: fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => s.trim().length > 0),
    name: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0),
    description: fc.string({ maxLength: 500 }),
    enabled: fc.boolean(),
    priority: fc.integer({ min: 0, max: 100 }),
    conditions: fc.array(ruleConditionArbitrary(), { maxLength: 5 }),
    reward: fc.record({
      calculationMethod: fc.constantFrom(
        "standard",
        "tiered",
        "flat_rate",
        "direct"
      ),
      baseMultiplier: fc.double({ min: 0.1, max: 10, noNaN: true }),
      bonusMultiplier: fc.double({ min: 0, max: 10, noNaN: true }),
      pointsRoundingStrategy: fc.constantFrom("floor", "ceiling", "nearest"),
      amountRoundingStrategy: fc.constantFrom(
        "floor",
        "ceiling",
        "nearest",
        "floor5",
        "none"
      ),
      blockSize: fc.double({ min: 0.01, max: 100, noNaN: true }),
      bonusTiers: fc.array(bonusTierArbitrary(), { maxLength: 5 }),
      monthlyCap: fc.option(fc.double({ min: 0, max: 100000, noNaN: true }), {
        nil: undefined,
      }),
      monthlyMinSpend: fc.option(
        fc.double({ min: 0, max: 100000, noNaN: true }),
        { nil: undefined }
      ),
      monthlySpendPeriodType: fc.option(
        fc.constantFrom("calendar", "statement", "statement_month"),
        { nil: undefined }
      ),
      pointsCurrency: fc
        .string({ minLength: 1, maxLength: 50 })
        .filter((s) => s.trim().length > 0),
    }),
  });
};

// Mock Supabase client that stores data in memory
function createInMemorySupabaseClient(): SupabaseClient {
  type StorageRecord = Record<string, unknown> & { id?: string };
  const storage = new Map<string, StorageRecord>();

  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: unknown) => {
          const results = Array.from(storage.values()).filter(
            (item) => item[column] === value
          );
          return Promise.resolve({ data: results, error: null });
        },
      }),
      insert: (data: StorageRecord[]) => ({
        select: () => {
          const inserted = data.map((item) => {
            const id = item.id || crypto.randomUUID();
            const record = { ...item, id };
            storage.set(id, record);
            return record;
          });
          return Promise.resolve({ data: inserted, error: null });
        },
      }),
      update: (data: Partial<StorageRecord>) => ({
        eq: (column: string, value: unknown) => ({
          select: () => {
            const existing = Array.from(storage.entries()).find(
              ([_, item]) => item[column] === value
            );
            if (existing) {
              const updated = { ...existing[1], ...data };
              storage.set(existing[0], updated);
              return Promise.resolve({ data: [updated], error: null });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
      delete: () => ({
        eq: (column: string, value: unknown) => ({
          select: () => {
            const toDelete = Array.from(storage.entries()).find(
              ([_, item]) => item[column] === value
            );
            if (toDelete) {
              storage.delete(toDelete[0]);
              return Promise.resolve({ data: [toDelete[1]], error: null });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
    }),
    auth: {
      getSession: () =>
        Promise.resolve({
          data: {
            session: {
              user: { id: "test-user-id" },
              access_token: "test-token",
            },
          },
          error: null,
        }),
    },
  } as unknown as SupabaseClient;
}

describe("Reward Rule Persistence Property-Based Tests", () => {
  beforeEach(() => {
    // Reset singleton instance before each test
    RuleRepository.resetInstance();
  });

  describe("**Feature: codebase-improvements, Property 1: Reward rule persistence round-trip**", () => {
    it("should preserve all fields when saving and reloading a reward rule", async () => {
      await fc.assert(
        fc.asyncProperty(rewardRuleDataArbitrary(), async (ruleData) => {
          // Create a fresh repository with in-memory storage for each test
          const supabase = createInMemorySupabaseClient();
          const repository = initializeRuleRepository(supabase);

          // Create the rule
          const savedRule = await repository.createRule(ruleData);

          // Reload the rule
          const reloadedRules = await repository.getRulesForCardType(
            ruleData.cardTypeId
          );

          // Find the rule we just created
          const reloadedRule = reloadedRules.find((r) => r.id === savedRule.id);

          // Verify the rule was found
          expect(reloadedRule).toBeDefined();

          if (!reloadedRule) {
            throw new Error("Rule not found after reload");
          }

          // Verify all fields are preserved
          expect(reloadedRule.cardTypeId).toBe(ruleData.cardTypeId);
          expect(reloadedRule.name).toBe(ruleData.name);
          expect(reloadedRule.description).toBe(ruleData.description);
          expect(reloadedRule.enabled).toBe(ruleData.enabled);
          expect(reloadedRule.priority).toBe(ruleData.priority);

          // Verify conditions array
          expect(reloadedRule.conditions).toEqual(ruleData.conditions);

          // Verify reward configuration
          expect(reloadedRule.reward.calculationMethod).toBe(
            ruleData.reward.calculationMethod
          );
          expect(reloadedRule.reward.baseMultiplier).toBeCloseTo(
            ruleData.reward.baseMultiplier,
            5
          );
          expect(reloadedRule.reward.bonusMultiplier).toBeCloseTo(
            ruleData.reward.bonusMultiplier,
            5
          );
          expect(reloadedRule.reward.pointsRoundingStrategy).toBe(
            ruleData.reward.pointsRoundingStrategy
          );
          expect(reloadedRule.reward.amountRoundingStrategy).toBe(
            ruleData.reward.amountRoundingStrategy
          );
          expect(reloadedRule.reward.blockSize).toBeCloseTo(
            ruleData.reward.blockSize,
            5
          );
          expect(reloadedRule.reward.pointsCurrency).toBe(
            ruleData.reward.pointsCurrency
          );

          // Verify bonus tiers
          expect(reloadedRule.reward.bonusTiers).toHaveLength(
            ruleData.reward.bonusTiers.length
          );

          // Verify optional fields
          if (ruleData.reward.monthlyCap !== undefined) {
            expect(reloadedRule.reward.monthlyCap).toBeCloseTo(
              ruleData.reward.monthlyCap,
              5
            );
          } else {
            expect(reloadedRule.reward.monthlyCap).toBeUndefined();
          }

          if (ruleData.reward.monthlyMinSpend !== undefined) {
            expect(reloadedRule.reward.monthlyMinSpend).toBeCloseTo(
              ruleData.reward.monthlyMinSpend,
              5
            );
          } else {
            expect(reloadedRule.reward.monthlyMinSpend).toBeUndefined();
          }

          if (ruleData.reward.monthlySpendPeriodType !== undefined) {
            expect(reloadedRule.reward.monthlySpendPeriodType).toBe(
              ruleData.reward.monthlySpendPeriodType
            );
          } else {
            expect(reloadedRule.reward.monthlySpendPeriodType).toBeUndefined();
          }

          // Verify timestamps exist
          expect(reloadedRule.createdAt).toBeInstanceOf(Date);
          expect(reloadedRule.updatedAt).toBeInstanceOf(Date);
        }),
        { numRuns: 100 }
      );
    });

    it("should preserve rule after update operation", async () => {
      await fc.assert(
        fc.asyncProperty(
          rewardRuleDataArbitrary(),
          fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          async (ruleData, newName) => {
            // Create a fresh repository with in-memory storage for each test
            RuleRepository.resetInstance();
            const supabase = createInMemorySupabaseClient();
            const repository = initializeRuleRepository(supabase);

            // Create the rule
            const savedRule = await repository.createRule(ruleData);

            // Update the rule
            const updatedRule = { ...savedRule, name: newName };
            await repository.updateRule(updatedRule);

            // Reload the rule
            const reloadedRules = await repository.getRulesForCardType(
              ruleData.cardTypeId
            );
            const reloadedRule = reloadedRules.find(
              (r) => r.id === savedRule.id
            );

            // Verify the rule was found and updated
            expect(reloadedRule).toBeDefined();
            expect(reloadedRule?.name).toBe(newName);

            // Verify other fields are still preserved
            expect(reloadedRule?.cardTypeId).toBe(ruleData.cardTypeId);
            expect(reloadedRule?.description).toBe(ruleData.description);
            expect(reloadedRule?.enabled).toBe(ruleData.enabled);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not return deleted rules", async () => {
      await fc.assert(
        fc.asyncProperty(rewardRuleDataArbitrary(), async (ruleData) => {
          // Create a fresh repository with in-memory storage for each test
          RuleRepository.resetInstance();
          const supabase = createInMemorySupabaseClient();
          const repository = initializeRuleRepository(supabase);

          // Create the rule
          const savedRule = await repository.createRule(ruleData);

          // Delete the rule
          await repository.deleteRule(savedRule.id);

          // Try to reload the rule
          const reloadedRules = await repository.getRulesForCardType(
            ruleData.cardTypeId
          );
          const reloadedRule = reloadedRules.find((r) => r.id === savedRule.id);

          // Verify the rule was not found
          expect(reloadedRule).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });
  });
});
