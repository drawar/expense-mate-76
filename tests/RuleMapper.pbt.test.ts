/**
 * Property-based tests for RuleMapper
 *
 * **Feature: codebase-improvements, Property 3: Database type mapping preservation**
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect } from "@jest/globals";
import fc from "fast-check";
import { RuleMapper } from "@/core/rewards/RuleMapper";
import { RewardRule, RuleCondition, BonusTier } from "@/core/rewards/types";

// Arbitraries for generating test data
const ruleConditionArbitrary = (): fc.Arbitrary<RuleCondition> =>
  fc.record({
    type: fc.constantFrom(
      "mcc",
      "transaction_type",
      "currency",
      "merchant",
      "amount",
      "compound",
      "category"
    ),
    operation: fc.constantFrom(
      "include",
      "exclude",
      "equals",
      "greater_than",
      "less_than",
      "range",
      "any",
      "all"
    ),
    values: fc.array(fc.oneof(fc.string(), fc.integer()), {
      minLength: 1,
      maxLength: 5,
    }),
    displayName: fc.option(fc.string(), { nil: undefined }),
    subConditions: fc.constant(undefined), // Simplified for now
  });

const bonusTierArbitrary = (): fc.Arbitrary<BonusTier> =>
  fc.record({
    minAmount: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), {
      nil: undefined,
    }),
    maxAmount: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), {
      nil: undefined,
    }),
    minSpend: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), {
      nil: undefined,
    }),
    maxSpend: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), {
      nil: undefined,
    }),
    multiplier: fc.float({ min: 0, max: 10, noNaN: true }),
    description: fc.option(fc.string(), { nil: undefined }),
    name: fc.option(fc.string(), { nil: undefined }),
    priority: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
    condition: fc.constant(undefined), // Simplified for now
  });

const rewardRuleArbitrary = (): fc.Arbitrary<RewardRule> =>
  fc.record({
    id: fc.uuid(),
    cardTypeId: fc.string({ minLength: 1, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 100 }),
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
      baseMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
      bonusMultiplier: fc.float({ min: 0, max: 10, noNaN: true }),
      pointsRoundingStrategy: fc.constantFrom("floor", "ceiling", "nearest"),
      amountRoundingStrategy: fc.constantFrom(
        "floor",
        "ceiling",
        "nearest",
        "floor5",
        "none"
      ),
      blockSize: fc.integer({ min: 1, max: 100 }),
      bonusTiers: fc.array(bonusTierArbitrary(), { maxLength: 5 }),
      monthlyCap: fc.option(fc.float({ min: 0, max: 100000, noNaN: true }), {
        nil: undefined,
      }),
      monthlyMinSpend: fc.option(
        fc.float({ min: 0, max: 100000, noNaN: true }),
        { nil: undefined }
      ),
      monthlySpendPeriodType: fc.option(
        fc.constantFrom("calendar", "statement", "statement_month"),
        { nil: undefined }
      ),
      pointsCurrency: fc.string({ minLength: 1, maxLength: 20 }),
    }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });

describe("RuleMapper Property-Based Tests", () => {
  const mapper = new RuleMapper();

  it("**Feature: codebase-improvements, Property 3: Database type mapping preservation** - Round-trip mapping preserves all data", () => {
    fc.assert(
      fc.property(rewardRuleArbitrary(), (rule) => {
        // Skip invalid dates
        if (
          isNaN(rule.createdAt.getTime()) ||
          isNaN(rule.updatedAt.getTime())
        ) {
          return true;
        }

        // Map to database format
        const dbRule = mapper.mapRewardRuleToDbRule(rule);

        // Add timestamps for complete round-trip
        const dbRuleWithTimestamps = {
          ...dbRule,
          created_at: rule.createdAt.toISOString(),
          updated_at: rule.updatedAt.toISOString(),
        };

        // Map back to application format
        const mappedRule = mapper.mapDbRuleToRewardRule(dbRuleWithTimestamps);

        // Verify all fields are preserved
        expect(mappedRule.id).toBe(rule.id);
        expect(mappedRule.cardTypeId).toBe(rule.cardTypeId);
        expect(mappedRule.name).toBe(rule.name);
        expect(mappedRule.description).toBe(rule.description);
        expect(mappedRule.enabled).toBe(rule.enabled);
        expect(mappedRule.priority).toBe(rule.priority);

        // Verify conditions are preserved
        expect(mappedRule.conditions).toEqual(rule.conditions);

        // Verify reward configuration is preserved
        expect(mappedRule.reward.calculationMethod).toBe(
          rule.reward.calculationMethod
        );
        expect(mappedRule.reward.baseMultiplier).toBeCloseTo(
          rule.reward.baseMultiplier,
          5
        );
        expect(mappedRule.reward.bonusMultiplier).toBeCloseTo(
          rule.reward.bonusMultiplier,
          5
        );
        expect(mappedRule.reward.pointsRoundingStrategy).toBe(
          rule.reward.pointsRoundingStrategy
        );
        expect(mappedRule.reward.amountRoundingStrategy).toBe(
          rule.reward.amountRoundingStrategy
        );
        expect(mappedRule.reward.blockSize).toBe(rule.reward.blockSize);
        expect(mappedRule.reward.bonusTiers).toEqual(rule.reward.bonusTiers);
        // Note: pointsCurrency is no longer stored in the database (removed in migration 20251219100000)
        // The mapper returns a placeholder value "points" - actual currency comes from PaymentMethod
        expect(mappedRule.reward.pointsCurrency).toBe("points");

        // Verify optional fields
        if (rule.reward.monthlyCap !== undefined) {
          expect(mappedRule.reward.monthlyCap).toBeCloseTo(
            rule.reward.monthlyCap,
            5
          );
        }
        if (rule.reward.monthlyMinSpend !== undefined) {
          expect(mappedRule.reward.monthlyMinSpend).toBeCloseTo(
            rule.reward.monthlyMinSpend,
            5
          );
        }
        if (rule.reward.monthlySpendPeriodType !== undefined) {
          expect(mappedRule.reward.monthlySpendPeriodType).toBe(
            rule.reward.monthlySpendPeriodType
          );
        }

        // Verify timestamps are preserved (within 1 second due to ISO string conversion)
        expect(
          Math.abs(mappedRule.createdAt.getTime() - rule.createdAt.getTime())
        ).toBeLessThan(1000);
        expect(
          Math.abs(mappedRule.updatedAt.getTime() - rule.updatedAt.getTime())
        ).toBeLessThan(1000);
      }),
      { numRuns: 100 }
    );
  });

  it("Mapping to database format produces valid database schema", () => {
    fc.assert(
      fc.property(rewardRuleArbitrary(), (rule) => {
        const dbRule = mapper.mapRewardRuleToDbRule(rule);

        // Verify all required database fields are present
        expect(dbRule.id).toBeDefined();
        expect(dbRule.card_type_id).toBeDefined();
        expect(dbRule.name).toBeDefined();
        expect(typeof dbRule.enabled).toBe("boolean");
        expect(typeof dbRule.priority).toBe("number");

        // Verify JSON fields are strings
        expect(typeof dbRule.conditions).toBe("string");
        expect(typeof dbRule.bonus_tiers).toBe("string");

        // Verify numeric fields are numbers
        expect(typeof dbRule.base_multiplier).toBe("number");
        expect(typeof dbRule.bonus_multiplier).toBe("number");
        expect(typeof dbRule.block_size).toBe("number");

        // Verify JSON can be parsed
        expect(() => JSON.parse(dbRule.conditions as string)).not.toThrow();
        expect(() => JSON.parse(dbRule.bonus_tiers as string)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });

  it("Mapping from database format handles null values correctly", () => {
    fc.assert(
      fc.property(rewardRuleArbitrary(), (rule) => {
        // Skip invalid dates
        if (
          isNaN(rule.createdAt.getTime()) ||
          isNaN(rule.updatedAt.getTime())
        ) {
          return true;
        }

        const dbRule = mapper.mapRewardRuleToDbRule(rule);

        // Create a version with some null values
        const dbRuleWithNulls = {
          ...dbRule,
          description: null,
          monthly_cap: null,
          monthly_min_spend: null,
          monthly_spend_period_type: null,
          created_at: rule.createdAt.toISOString(),
          updated_at: rule.updatedAt.toISOString(),
        };

        // Should not throw
        const mappedRule = mapper.mapDbRuleToRewardRule(dbRuleWithNulls);

        // Verify defaults are applied
        expect(mappedRule.description).toBe("");
        expect(mappedRule.reward.monthlyCap).toBeUndefined();
        expect(mappedRule.reward.monthlyMinSpend).toBeUndefined();
        expect(mappedRule.reward.monthlySpendPeriodType).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
