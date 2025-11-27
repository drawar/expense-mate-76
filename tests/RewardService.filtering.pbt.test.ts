/**
 * Property-Based Tests for Reward Service Rule Filtering
 *
 * **Feature: codebase-improvements, Property 6: Applicable rules filtering**
 * **Validates: Requirements 5.1**
 */

import fc from "fast-check";
import { RewardService } from "../src/core/rewards/RewardService";
import { RuleRepository } from "../src/core/rewards/RuleRepository";
import {
  RewardRule,
  CalculationInput,
  RuleCondition,
  BonusTier,
} from "../src/core/rewards/types";
import { cardTypeIdService } from "../src/core/rewards/CardTypeIdService";
import { DateTime } from "luxon";

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

const rewardRuleArbitrary = (cardTypeId: string): fc.Arbitrary<RewardRule> => {
  return fc.record({
    id: fc.uuid(),
    cardTypeId: fc.constant(cardTypeId),
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
      pointsCurrency: fc.string({ minLength: 1, maxLength: 50 }),
    }),
    createdAt: fc.date(),
    updatedAt: fc.date(),
  });
};

const paymentMethodArbitrary = (): fc.Arbitrary<{
  id: string;
  issuer: string;
  name: string;
  pointsCurrency: string;
}> => {
  return fc.record({
    id: fc.uuid(),
    issuer: fc.string({ minLength: 1, maxLength: 50 }),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    pointsCurrency: fc.string({ minLength: 1, maxLength: 20 }),
  });
};

// Mock repository that returns predefined rules
class MockRuleRepository {
  private rules: Map<string, RewardRule[]> = new Map();

  setRulesForCardType(cardTypeId: string, rules: RewardRule[]): void {
    this.rules.set(cardTypeId, rules);
  }

  async getRulesForCardType(cardTypeId: string): Promise<RewardRule[]> {
    return this.rules.get(cardTypeId) || [];
  }

  async findApplicableRules(): Promise<RewardRule[]> {
    return [];
  }

  async createRule(): Promise<RewardRule> {
    throw new Error("Not implemented");
  }

  async updateRule(): Promise<void> {
    throw new Error("Not implemented");
  }

  async deleteRule(): Promise<void> {
    throw new Error("Not implemented");
  }
}

describe("Reward Service Rule Filtering Property-Based Tests", () => {
  describe("**Feature: codebase-improvements, Property 6: Applicable rules filtering**", () => {
    it("should only return rules where the card type ID matches the payment method", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          async (paymentMethod, otherCardTypeIds, amount) => {
            // Generate the correct card type ID for the payment method
            const correctCardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Generate rules for the correct card type
            const correctRules = await fc.sample(
              rewardRuleArbitrary(correctCardTypeId),
              { numRuns: 3 }
            );
            mockRepository.setRulesForCardType(correctCardTypeId, correctRules);

            // Generate rules for other card types
            for (const otherCardTypeId of otherCardTypeIds) {
              if (otherCardTypeId !== correctCardTypeId) {
                const otherRules = await fc.sample(
                  rewardRuleArbitrary(otherCardTypeId),
                  { numRuns: 2 }
                );
                mockRepository.setRulesForCardType(otherCardTypeId, otherRules);
              }
            }

            // Create RewardService with mock repository
            const rewardService = new RewardService(
              mockRepository as unknown as RuleRepository
            );

            // Create calculation input
            const input: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // If a rule was applied, verify it has the correct card type ID
            if (result.appliedRule) {
              expect(result.appliedRule.cardTypeId).toBe(correctCardTypeId);
            }

            // Verify that the service only considered rules from the correct card type
            // This is implicit in the test - if it used rules from other card types,
            // the appliedRule would have a different cardTypeId
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should not apply disabled rules", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          async (paymentMethod, amount) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Generate rules - some enabled, some disabled
            const rules = await fc.sample(rewardRuleArbitrary(cardTypeId), {
              numRuns: 5,
            });

            // Ensure at least one rule is disabled
            if (rules.length > 0) {
              rules[0].enabled = false;
            }

            mockRepository.setRulesForCardType(cardTypeId, rules);

            // Create RewardService with mock repository
            const rewardService = new RewardService(
              mockRepository as unknown as RuleRepository
            );

            // Create calculation input
            const input: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // If a rule was applied, verify it is enabled
            if (result.appliedRule) {
              expect(result.appliedRule.enabled).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should evaluate conditions before applying rules", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.string({ minLength: 4, maxLength: 4 }), // MCC code
          async (paymentMethod, amount, mcc) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule with an MCC condition that excludes our test MCC
            const ruleWithCondition: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Test Rule",
              description: "Test",
              enabled: true,
              priority: 1,
              conditions: [
                {
                  type: "mcc",
                  operation: "exclude",
                  values: [mcc],
                },
              ],
              reward: {
                calculationMethod: "standard",
                baseMultiplier: 1,
                bonusMultiplier: 0,
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: "none",
                blockSize: 1,
                bonusTiers: [],
                pointsCurrency: "points",
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            mockRepository.setRulesForCardType(cardTypeId, [ruleWithCondition]);

            // Create RewardService with mock repository
            const rewardService = new RewardService(
              mockRepository as unknown as RuleRepository
            );

            // Create calculation input with the excluded MCC
            const input: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc, // This MCC is excluded by the rule
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // The rule should NOT be applied because the MCC is excluded
            expect(result.appliedRule).toBeUndefined();
            expect(result.totalPoints).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
