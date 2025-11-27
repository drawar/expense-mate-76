/**
 * Property-Based Tests for Reward Service Condition Evaluation
 *
 * **Feature: codebase-improvements, Property 8: Condition evaluation completeness**
 * **Validates: Requirements 5.3**
 */

import fc from "fast-check";
import { RewardService } from "../src/core/rewards/RewardService";
import { RuleRepository } from "../src/core/rewards/RuleRepository";
import {
  RewardRule,
  CalculationInput,
  RuleCondition,
} from "../src/core/rewards/types";
import { cardTypeIdService } from "../src/core/rewards/CardTypeIdService";
import { DateTime } from "luxon";

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

describe("Reward Service Condition Evaluation Property-Based Tests", () => {
  describe("**Feature: codebase-improvements, Property 8: Condition evaluation completeness**", () => {
    it("should only apply rules when ALL conditions evaluate to true", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.string({ minLength: 4, maxLength: 4 }), // MCC code
          fc
            .string({ minLength: 5, maxLength: 50 })
            .filter((s) => s.trim().length > 0), // Merchant name - non-empty
          async (paymentMethod, amount, mcc, merchantName) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Use a unique marker that won't accidentally match
            const uniqueMarker = `__UNIQUE_${crypto.randomUUID()}__`;

            // Create a rule with multiple conditions that must ALL be true
            const ruleWithMultipleConditions: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Multi-Condition Rule",
              description: "Requires both MCC and merchant to match",
              enabled: true,
              priority: 1,
              conditions: [
                {
                  type: "mcc",
                  operation: "include",
                  values: [mcc], // Must match this MCC
                },
                {
                  type: "merchant",
                  operation: "include",
                  values: [uniqueMarker], // Must contain this unique marker
                },
              ],
              reward: {
                calculationMethod: "standard",
                baseMultiplier: 2,
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

            mockRepository.setRulesForCardType(cardTypeId, [
              ruleWithMultipleConditions,
            ]);

            // Create RewardService with mock repository
            const rewardService = new RewardService(
              mockRepository as unknown as RuleRepository
            );

            // Test 1: Both conditions match - rule should apply
            const inputBothMatch: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc,
              merchantName: `${merchantName} ${uniqueMarker}`, // Contains the unique marker
              transactionType: "purchase",
              date: DateTime.now(),
            };

            const resultBothMatch =
              await rewardService.calculateRewards(inputBothMatch);
            expect(resultBothMatch.appliedRule).toBeDefined();
            expect(resultBothMatch.totalPoints).toBeGreaterThan(0);

            // Test 2: Only MCC matches - rule should NOT apply
            const inputOnlyMcc: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc,
              merchantName, // Does NOT contain the unique marker
              transactionType: "purchase",
              date: DateTime.now(),
            };

            const resultOnlyMcc =
              await rewardService.calculateRewards(inputOnlyMcc);
            expect(resultOnlyMcc.appliedRule).toBeUndefined();
            expect(resultOnlyMcc.totalPoints).toBe(0);

            // Test 3: Only merchant matches - rule should NOT apply
            const inputOnlyMerchant: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc: "9999", // Different MCC
              merchantName: `${merchantName} ${uniqueMarker}`, // Contains the unique marker
              transactionType: "purchase",
              date: DateTime.now(),
            };

            const resultOnlyMerchant =
              await rewardService.calculateRewards(inputOnlyMerchant);
            expect(resultOnlyMerchant.appliedRule).toBeUndefined();
            expect(resultOnlyMerchant.totalPoints).toBe(0);

            // Test 4: Neither condition matches - rule should NOT apply
            const inputNeitherMatch: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc: "9999",
              merchantName, // Does NOT contain the unique marker
              transactionType: "purchase",
              date: DateTime.now(),
            };

            const resultNeitherMatch =
              await rewardService.calculateRewards(inputNeitherMatch);
            expect(resultNeitherMatch.appliedRule).toBeUndefined();
            expect(resultNeitherMatch.totalPoints).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should apply rules with no conditions to all transactions", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.option(fc.string({ minLength: 4, maxLength: 4 }), {
            nil: undefined,
          }),
          fc.option(fc.string({ minLength: 1, maxLength: 50 }), {
            nil: undefined,
          }),
          async (paymentMethod, amount, mcc, merchantName) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule with NO conditions (should apply to all transactions)
            const ruleWithNoConditions: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Universal Rule",
              description: "Applies to all transactions",
              enabled: true,
              priority: 1,
              conditions: [], // No conditions
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

            mockRepository.setRulesForCardType(cardTypeId, [
              ruleWithNoConditions,
            ]);

            // Create RewardService with mock repository
            const rewardService = new RewardService(
              mockRepository as unknown as RuleRepository
            );

            // Create calculation input with random MCC and merchant (or undefined)
            const input: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc,
              merchantName,
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Rule should always apply since there are no conditions
            expect(result.appliedRule).toBeDefined();
            expect(result.appliedRule?.id).toBe(ruleWithNoConditions.id);
            expect(result.totalPoints).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should correctly evaluate MCC include conditions", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.array(fc.string({ minLength: 4, maxLength: 4 }), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.string({ minLength: 4, maxLength: 4 }),
          async (paymentMethod, amount, includedMccs, testMcc) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule that includes specific MCCs
            const rule: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "MCC Include Rule",
              description: "Only applies to specific MCCs",
              enabled: true,
              priority: 1,
              conditions: [
                {
                  type: "mcc",
                  operation: "include",
                  values: includedMccs,
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

            mockRepository.setRulesForCardType(cardTypeId, [rule]);

            // Create RewardService with mock repository
            const rewardService = new RewardService(
              mockRepository as unknown as RuleRepository
            );

            // Create calculation input
            const input: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc: testMcc,
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Rule should apply only if testMcc is in includedMccs
            const shouldApply = includedMccs.includes(testMcc);

            if (shouldApply) {
              expect(result.appliedRule).toBeDefined();
              expect(result.totalPoints).toBeGreaterThan(0);
            } else {
              expect(result.appliedRule).toBeUndefined();
              expect(result.totalPoints).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should correctly evaluate MCC exclude conditions", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.array(fc.string({ minLength: 4, maxLength: 4 }), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.string({ minLength: 4, maxLength: 4 }),
          async (paymentMethod, amount, excludedMccs, testMcc) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule that excludes specific MCCs
            const rule: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "MCC Exclude Rule",
              description: "Does not apply to specific MCCs",
              enabled: true,
              priority: 1,
              conditions: [
                {
                  type: "mcc",
                  operation: "exclude",
                  values: excludedMccs,
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

            mockRepository.setRulesForCardType(cardTypeId, [rule]);

            // Create RewardService with mock repository
            const rewardService = new RewardService(
              mockRepository as unknown as RuleRepository
            );

            // Create calculation input
            const input: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc: testMcc,
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Rule should apply only if testMcc is NOT in excludedMccs
            const shouldApply = !excludedMccs.includes(testMcc);

            if (shouldApply) {
              expect(result.appliedRule).toBeDefined();
              expect(result.totalPoints).toBeGreaterThan(0);
            } else {
              expect(result.appliedRule).toBeUndefined();
              expect(result.totalPoints).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should correctly evaluate amount range conditions", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 100, noNaN: true }), // Start from 1 to avoid 0
          fc.double({ min: 100, max: 500, noNaN: true }),
          fc.double({ min: 0, max: 1000, noNaN: true }),
          async (paymentMethod, minAmount, maxAmount, testAmount) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule with amount range condition
            const rule: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Amount Range Rule",
              description: "Only applies to amounts in range",
              enabled: true,
              priority: 1,
              conditions: [
                {
                  type: "amount",
                  operation: "range",
                  values: [minAmount, maxAmount],
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

            mockRepository.setRulesForCardType(cardTypeId, [rule]);

            // Create RewardService with mock repository
            const rewardService = new RewardService(
              mockRepository as unknown as RuleRepository
            );

            // Create calculation input
            const input: CalculationInput = {
              amount: testAmount,
              currency: "USD",
              paymentMethod,
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Rule should apply only if testAmount is within range
            const shouldApply =
              testAmount >= minAmount && testAmount <= maxAmount;

            if (shouldApply) {
              expect(result.appliedRule).toBeDefined();
              // Only check points > 0 if amount > 0
              if (testAmount > 0) {
                expect(result.totalPoints).toBeGreaterThan(0);
              }
            } else {
              expect(result.appliedRule).toBeUndefined();
              expect(result.totalPoints).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
