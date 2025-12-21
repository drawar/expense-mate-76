/**
 * Property-Based Tests for Reward Service Rule Priority Ordering
 *
 * **Feature: codebase-improvements, Property 7: Rule priority ordering**
 * **Validates: Requirements 5.2**
 */

import fc from "fast-check";
import { RewardService } from "../src/core/rewards/RewardService";
import { RuleRepository } from "../src/core/rewards/RuleRepository";
import { RewardRule, CalculationInput } from "../src/core/rewards/types";
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

describe("Reward Service Rule Priority Ordering Property-Based Tests", () => {
  describe("**Feature: codebase-improvements, Property 7: Rule priority ordering**", () => {
    it("should apply rules in descending priority order (higher priority number = higher precedence)", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.array(fc.integer({ min: 0, max: 100 }), {
            minLength: 2,
            maxLength: 10,
          }),
          async (paymentMethod, amount, priorities) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create rules with different priorities and different base multipliers
            // so we can identify which rule was applied
            const rules: RewardRule[] = priorities.map((priority, index) => ({
              id: crypto.randomUUID(),
              cardTypeId,
              name: `Rule ${index}`,
              description: `Priority ${priority}`,
              enabled: true,
              priority,
              conditions: [], // No conditions, so all rules match
              reward: {
                calculationMethod: "standard",
                baseMultiplier: priority + 1, // Use priority+1 as multiplier to identify which rule was applied
                bonusMultiplier: 0,
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: "none",
                blockSize: 1,
                bonusTiers: [],
                pointsCurrency: "points",
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            }));

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

            // Find the rule with the highest priority number (highest precedence)
            const highestPriority = Math.max(...priorities);
            const expectedRule = rules.find(
              (r) => r.priority === highestPriority
            );

            // Verify that the rule with the highest priority number was applied
            if (result.appliedRule && expectedRule) {
              expect(result.appliedRule.priority).toBe(highestPriority);
              expect(result.appliedRule.id).toBe(expectedRule.id);

              // Verify the points were calculated using the correct multiplier
              const expectedPoints = Math.floor(amount * (highestPriority + 1));
              expect(result.basePoints).toBe(expectedPoints);
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 30000);

    it("should apply the first rule when multiple rules have the same priority", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.integer({ min: 0, max: 100 }),
          async (paymentMethod, amount, priority) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create multiple rules with the same priority
            const rules: RewardRule[] = [
              {
                id: "rule-1",
                cardTypeId,
                name: "Rule 1",
                description: "First rule",
                enabled: true,
                priority,
                conditions: [],
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
              },
              {
                id: "rule-2",
                cardTypeId,
                name: "Rule 2",
                description: "Second rule",
                enabled: true,
                priority,
                conditions: [],
                reward: {
                  calculationMethod: "standard",
                  baseMultiplier: 3,
                  bonusMultiplier: 0,
                  pointsRoundingStrategy: "floor",
                  amountRoundingStrategy: "none",
                  blockSize: 1,
                  bonusTiers: [],
                  pointsCurrency: "points",
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ];

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

            // When priorities are equal, the first rule in the sorted array should be applied
            // Since both have the same priority, the sort is stable and maintains original order
            if (result.appliedRule) {
              expect(result.appliedRule.priority).toBe(priority);
              // The first rule should be applied (multiplier = 2)
              const expectedPoints = Math.floor(amount * 2);
              expect(result.basePoints).toBe(expectedPoints);
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 30000);

    it("should skip disabled rules even if they have higher priority", async () => {
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

            // Create rules where the highest priority rule is disabled
            // Note: Higher priority number = higher precedence in this implementation
            const rules: RewardRule[] = [
              {
                id: "disabled-rule",
                cardTypeId,
                name: "Disabled High Priority Rule",
                description: "Should be skipped",
                enabled: false, // Disabled
                priority: 100, // Highest priority (higher number = higher precedence)
                conditions: [],
                reward: {
                  calculationMethod: "standard",
                  baseMultiplier: 10,
                  bonusMultiplier: 0,
                  pointsRoundingStrategy: "floor",
                  amountRoundingStrategy: "none",
                  blockSize: 1,
                  bonusTiers: [],
                  pointsCurrency: "points",
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: "enabled-rule",
                cardTypeId,
                name: "Enabled Lower Priority Rule",
                description: "Should be applied",
                enabled: true, // Enabled
                priority: 1, // Lower priority (lower number = lower precedence)
                conditions: [],
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
              },
            ];

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

            // The enabled rule should be applied, not the disabled one
            if (result.appliedRule) {
              expect(result.appliedRule.id).toBe("enabled-rule");
              expect(result.appliedRule.enabled).toBe(true);
              expect(result.appliedRule.priority).toBe(1);

              // Verify points were calculated with the enabled rule's multiplier
              const expectedPoints = Math.floor(amount * 2);
              expect(result.basePoints).toBe(expectedPoints);
            }
          }
        ),
        { numRuns: 50 }
      );
    }, 30000);
  });
});
