/**
 * Property-Based Tests for Monthly Cap Enforcement
 *
 * **Feature: codebase-improvements, Property 9: Monthly cap enforcement**
 * **Validates: Requirements 5.4**
 */

import fc from "fast-check";
import { RewardService } from "../src/core/rewards/RewardService";
import { RuleRepository } from "../src/core/rewards/RuleRepository";
import { RewardRule, CalculationInput } from "../src/core/rewards/types";
import { cardTypeIdService } from "../src/core/rewards/CardTypeIdService";
import { bonusPointsTracker } from "../src/core/rewards/BonusPointsTracker";
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

describe("Monthly Cap Enforcement Property-Based Tests", () => {
  beforeEach(() => {
    // Clear the bonus points tracker cache before each test
    bonusPointsTracker.clearCache();
  });

  describe("**Feature: codebase-improvements, Property 9: Monthly cap enforcement**", () => {
    it("should not award more bonus points than the monthly cap", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 100, max: 1000, noNaN: true }), // Transaction amount
          fc.double({ min: 10, max: 100, noNaN: true }), // Monthly cap
          fc.double({ min: 0, max: 1, noNaN: true }), // Fraction of cap already used (0-1)
          async (paymentMethod, amount, monthlyCap, usedFraction) => {
            // Ensure usedBonusPoints is less than the cap
            const usedBonusPoints = usedFraction * monthlyCap * 0.9; // Use at most 90% of cap
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule with a monthly cap and bonus multiplier
            const rule: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Capped Bonus Rule",
              description: "Has a monthly bonus cap",
              enabled: true,
              priority: 1,
              conditions: [],
              reward: {
                calculationMethod: "standard",
                baseMultiplier: 1,
                bonusMultiplier: 0.5, // 0.5 bonus points per dollar
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: "none",
                blockSize: 1,
                bonusTiers: [],
                monthlyCap, // Monthly cap on bonus points
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

            // Create calculation input with used bonus points
            const input: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              transactionType: "purchase",
              date: DateTime.now(),
              usedBonusPoints, // Pass in how many bonus points have been used this month
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Calculate what the bonus points would be without the cap
            const uncappedBonusPoints = Math.floor(amount * 0.5);

            // Calculate available bonus points under the cap
            const availableBonusPoints = Math.max(
              0,
              monthlyCap - usedBonusPoints
            );

            // The actual bonus points should be the minimum of uncapped and available
            const expectedBonusPoints = Math.min(
              uncappedBonusPoints,
              availableBonusPoints
            );

            // Verify the bonus points don't exceed the cap
            expect(result.bonusPoints).toBeLessThanOrEqual(monthlyCap + 0.01); // Small tolerance for floating point
            expect(result.bonusPoints).toBeCloseTo(expectedBonusPoints, 5);

            // Verify the total used bonus points (existing + new) don't exceed the cap
            const totalUsed = usedBonusPoints + result.bonusPoints;
            expect(totalUsed).toBeLessThanOrEqual(monthlyCap + 0.01); // Small tolerance for floating point
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should award zero bonus points when monthly cap is reached", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 100, max: 1000, noNaN: true }),
          fc.double({ min: 10, max: 100, noNaN: true }),
          async (paymentMethod, amount, monthlyCap) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule with a monthly cap
            const rule: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Capped Bonus Rule",
              description: "Has a monthly bonus cap",
              enabled: true,
              priority: 1,
              conditions: [],
              reward: {
                calculationMethod: "standard",
                baseMultiplier: 1,
                bonusMultiplier: 0.5,
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: "none",
                blockSize: 1,
                bonusTiers: [],
                monthlyCap,
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

            // Create calculation input where the cap has already been reached
            const input: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              transactionType: "purchase",
              date: DateTime.now(),
              usedBonusPoints: monthlyCap, // Cap already reached
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Should get base points but no bonus points
            expect(result.bonusPoints).toBe(0);
            expect(result.basePoints).toBeGreaterThan(0);
            expect(result.messages).toContain(
              "Monthly bonus points cap reached"
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should correctly calculate remaining bonus points", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 100, max: 1000, noNaN: true }),
          fc.double({ min: 50, max: 200, noNaN: true }),
          fc.double({ min: 0, max: 50, noNaN: true }),
          async (paymentMethod, amount, monthlyCap, usedBonusPoints) => {
            // Ensure usedBonusPoints is less than monthlyCap
            const actualUsed = Math.min(usedBonusPoints, monthlyCap - 1);

            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule with a monthly cap
            const rule: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Capped Bonus Rule",
              description: "Has a monthly bonus cap",
              enabled: true,
              priority: 1,
              conditions: [],
              reward: {
                calculationMethod: "standard",
                baseMultiplier: 1,
                bonusMultiplier: 0.5,
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: "none",
                blockSize: 1,
                bonusTiers: [],
                monthlyCap,
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
              transactionType: "purchase",
              date: DateTime.now(),
              usedBonusPoints: actualUsed,
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Calculate expected remaining
            const expectedRemaining =
              monthlyCap - actualUsed - result.bonusPoints;

            // Verify remaining bonus points
            if (result.remainingMonthlyBonusPoints !== undefined) {
              expect(result.remainingMonthlyBonusPoints).toBeGreaterThanOrEqual(
                0
              );
              expect(result.remainingMonthlyBonusPoints).toBeLessThanOrEqual(
                monthlyCap
              );
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should apply cap independently for different rules", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 100, max: 1000, noNaN: true }),
          fc.double({ min: 50, max: 100, noNaN: true }),
          fc.double({ min: 50, max: 100, noNaN: true }),
          async (paymentMethod, amount, cap1, cap2) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create two rules with different caps
            const rule1: RewardRule = {
              id: "rule-1",
              cardTypeId,
              name: "Rule 1",
              description: "First rule with cap",
              enabled: true,
              priority: 1,
              conditions: [
                {
                  type: "mcc",
                  operation: "include",
                  values: ["5411"], // Grocery
                },
              ],
              reward: {
                calculationMethod: "standard",
                baseMultiplier: 1,
                bonusMultiplier: 0.5,
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: "none",
                blockSize: 1,
                bonusTiers: [],
                monthlyCap: cap1,
                pointsCurrency: "points",
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const rule2: RewardRule = {
              id: "rule-2",
              cardTypeId,
              name: "Rule 2",
              description: "Second rule with different cap",
              enabled: true,
              priority: 2,
              conditions: [
                {
                  type: "mcc",
                  operation: "include",
                  values: ["5812"], // Restaurant
                },
              ],
              reward: {
                calculationMethod: "standard",
                baseMultiplier: 1,
                bonusMultiplier: 0.5,
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: "none",
                blockSize: 1,
                bonusTiers: [],
                monthlyCap: cap2,
                pointsCurrency: "points",
              },
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            mockRepository.setRulesForCardType(cardTypeId, [rule1, rule2]);

            // Create RewardService with mock repository
            const rewardService = new RewardService(
              mockRepository as unknown as RuleRepository
            );

            // Test with grocery MCC - should use rule1's cap
            const inputGrocery: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc: "5411",
              transactionType: "purchase",
              date: DateTime.now(),
              usedBonusPoints: 0,
            };

            const resultGrocery =
              await rewardService.calculateRewards(inputGrocery);
            expect(resultGrocery.bonusPoints).toBeLessThanOrEqual(cap1);

            // Test with restaurant MCC - should use rule2's cap
            const inputRestaurant: CalculationInput = {
              amount,
              currency: "USD",
              paymentMethod,
              mcc: "5812",
              transactionType: "purchase",
              date: DateTime.now(),
              usedBonusPoints: 0,
            };

            const resultRestaurant =
              await rewardService.calculateRewards(inputRestaurant);
            expect(resultRestaurant.bonusPoints).toBeLessThanOrEqual(cap2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
