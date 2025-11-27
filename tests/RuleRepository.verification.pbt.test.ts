/**
 * Property-Based Tests for Database Operation Verification
 *
 * **Feature: codebase-improvements, Property 13: Database operation verification**
 * **Validates: Requirements 7.5, 7.6**
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
import { PersistenceError } from "../src/core/rewards/errors";

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
  // Generate non-empty, non-whitespace strings for required fields
  const nonEmptyString = (minLength: number, maxLength: number) =>
    fc.string({ minLength, maxLength }).filter((s) => s.trim().length > 0);

  return fc.record({
    cardTypeId: nonEmptyString(1, 50),
    name: nonEmptyString(1, 100),
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
      pointsCurrency: nonEmptyString(1, 50),
    }),
  });
};

// Mock Supabase client that can simulate failures
function createFailingSupabaseClient(
  failureMode: "create" | "update" | "delete" | "none"
): SupabaseClient {
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
          if (failureMode === "create") {
            // Simulate failure by returning no data
            return Promise.resolve({ data: [], error: null });
          }
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
            if (failureMode === "update") {
              // Simulate failure by returning no data
              return Promise.resolve({ data: [], error: null });
            }
            const existing = Array.from(storage.entries()).find(
              ([_, item]) => item[column] === value
            );
            if (existing) {
              storage.set(existing[0], { ...existing[1], ...data });
              return Promise.resolve({
                data: [{ ...existing[1], ...data }],
                error: null,
              });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
      delete: () => ({
        eq: (column: string, value: unknown) => ({
          select: () => {
            if (failureMode === "delete") {
              // Simulate failure by returning no data
              return Promise.resolve({ data: [], error: null });
            }
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
          data: { session: { user: { id: "test-user" } } },
          error: null,
        }),
    },
  } as unknown as SupabaseClient;
}

describe("Database Operation Verification Property-Based Tests", () => {
  beforeEach(() => {
    // Reset singleton instance before each test
    RuleRepository.resetInstance();
  });

  describe("**Feature: codebase-improvements, Property 13: Database operation verification**", () => {
    it("should throw PersistenceError when create operation returns no data", async () => {
      await fc.assert(
        fc.asyncProperty(rewardRuleDataArbitrary(), async (ruleData) => {
          // Create a repository with a failing client
          RuleRepository.resetInstance();
          const supabase = createFailingSupabaseClient("create");
          const repository = initializeRuleRepository(supabase);

          // Attempt to create the rule - should throw PersistenceError
          await expect(repository.createRule(ruleData)).rejects.toThrow(
            PersistenceError
          );
          await expect(repository.createRule(ruleData)).rejects.toThrow(
            "Rule creation did not return created data"
          );
        }),
        { numRuns: 100 }
      );
    });

    it("should throw PersistenceError when update operation returns no data", async () => {
      await fc.assert(
        fc.asyncProperty(rewardRuleDataArbitrary(), async (ruleData) => {
          // First create a rule with a working client
          RuleRepository.resetInstance();
          const workingSupabase = createFailingSupabaseClient("none");
          const workingRepository = initializeRuleRepository(workingSupabase);
          const createdRule = await workingRepository.createRule(ruleData);

          // Now try to update with a failing client
          RuleRepository.resetInstance();
          const failingSupabase = createFailingSupabaseClient("update");
          const failingRepository = initializeRuleRepository(failingSupabase);

          // Attempt to update the rule - should throw PersistenceError
          await expect(
            failingRepository.updateRule(createdRule)
          ).rejects.toThrow(PersistenceError);
          await expect(
            failingRepository.updateRule(createdRule)
          ).rejects.toThrow("Rule update did not affect any rows");
        }),
        { numRuns: 100 }
      );
    });

    it("should throw PersistenceError when delete operation returns no data", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => s.trim().length > 0),
          async (ruleId) => {
            // Create a repository with a failing delete client
            RuleRepository.resetInstance();
            const supabase = createFailingSupabaseClient("delete");
            const repository = initializeRuleRepository(supabase);

            // Attempt to delete the rule - should throw PersistenceError
            await expect(repository.deleteRule(ruleId)).rejects.toThrow(
              PersistenceError
            );
            await expect(repository.deleteRule(ruleId)).rejects.toThrow(
              "Rule deletion did not affect any rows"
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should successfully complete create operation when data is returned", async () => {
      await fc.assert(
        fc.asyncProperty(rewardRuleDataArbitrary(), async (ruleData) => {
          // Create a repository with a working client
          RuleRepository.resetInstance();
          const supabase = createFailingSupabaseClient("none");
          const repository = initializeRuleRepository(supabase);

          // Create the rule - should succeed
          const createdRule = await repository.createRule(ruleData);

          // Verify the rule was created
          expect(createdRule).toBeDefined();
          expect(createdRule.id).toBeDefined();
          expect(createdRule.name).toBe(ruleData.name);
          expect(createdRule.cardTypeId).toBe(ruleData.cardTypeId);
        }),
        { numRuns: 100 }
      );
    });

    it("should successfully complete update operation when data is returned", async () => {
      await fc.assert(
        fc.asyncProperty(
          rewardRuleDataArbitrary(),
          fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          async (ruleData, newName) => {
            // Create a repository with a working client
            RuleRepository.resetInstance();
            const supabase = createFailingSupabaseClient("none");
            const repository = initializeRuleRepository(supabase);

            // Create the rule
            const createdRule = await repository.createRule(ruleData);

            // Update the rule - should succeed
            const updatedRule = { ...createdRule, name: newName };
            await expect(
              repository.updateRule(updatedRule)
            ).resolves.not.toThrow();

            // Verify the update persisted
            const reloadedRules = await repository.getRulesForCardType(
              ruleData.cardTypeId
            );
            const reloadedRule = reloadedRules.find(
              (r) => r.id === createdRule.id
            );
            expect(reloadedRule?.name).toBe(newName);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should successfully complete delete operation when data is returned", async () => {
      await fc.assert(
        fc.asyncProperty(rewardRuleDataArbitrary(), async (ruleData) => {
          // Create a repository with a working client
          RuleRepository.resetInstance();
          const supabase = createFailingSupabaseClient("none");
          const repository = initializeRuleRepository(supabase);

          // Create the rule
          const createdRule = await repository.createRule(ruleData);

          // Delete the rule - should succeed
          await expect(
            repository.deleteRule(createdRule.id)
          ).resolves.not.toThrow();

          // Verify the rule was deleted
          const reloadedRules = await repository.getRulesForCardType(
            ruleData.cardTypeId
          );
          const reloadedRule = reloadedRules.find(
            (r) => r.id === createdRule.id
          );
          expect(reloadedRule).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });
  });
});
