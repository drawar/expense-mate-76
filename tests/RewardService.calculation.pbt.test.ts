/**
 * Property-Based Tests for Points Calculation Accuracy
 *
 * **Feature: codebase-improvements, Property 10: Points calculation accuracy**
 * **Validates: Requirements 5.5**
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

describe("Points Calculation Accuracy Property-Based Tests", () => {
  describe("**Feature: codebase-improvements, Property 10: Points calculation accuracy**", () => {
    it("should calculate points as (amount / blockSize) * baseMultiplier, rounded according to strategy", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.double({ min: 0.1, max: 10, noNaN: true }), // baseMultiplier
          fc.double({ min: 0.1, max: 100, noNaN: true }), // blockSize
          fc.constantFrom("floor", "ceiling", "nearest"),
          async (
            paymentMethod,
            amount,
            baseMultiplier,
            blockSize,
            roundingStrategy
          ) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule with standard calculation
            const rule: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Standard Points Rule",
              description: "Standard points calculation",
              enabled: true,
              priority: 1,
              conditions: [],
              reward: {
                calculationMethod: "standard",
                baseMultiplier,
                bonusMultiplier: 0,
                pointsRoundingStrategy: roundingStrategy as
                  | "floor"
                  | "ceiling"
                  | "nearest",
                amountRoundingStrategy: "none",
                blockSize,
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
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Calculate expected points
            let expectedPoints = (amount / blockSize) * baseMultiplier;

            switch (roundingStrategy) {
              case "floor":
                expectedPoints = Math.floor(expectedPoints);
                break;
              case "ceiling":
                expectedPoints = Math.ceil(expectedPoints);
                break;
              case "nearest":
                expectedPoints = Math.round(expectedPoints);
                break;
            }

            // Verify the calculation
            expect(result.basePoints).toBe(expectedPoints);
            expect(result.totalPoints).toBe(expectedPoints); // No bonus points
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should calculate total points as basePoints + bonusPoints", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1, max: 1000, noNaN: true }),
          fc.double({ min: 0.1, max: 5, noNaN: true }), // baseMultiplier
          fc.double({ min: 0.1, max: 5, noNaN: true }), // bonusMultiplier
          async (paymentMethod, amount, baseMultiplier, bonusMultiplier) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule with base and bonus multipliers
            const rule: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Base + Bonus Rule",
              description: "Has both base and bonus points",
              enabled: true,
              priority: 1,
              conditions: [],
              reward: {
                calculationMethod: "standard",
                baseMultiplier,
                bonusMultiplier,
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
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Verify total = base + bonus
            expect(result.totalPoints).toBe(
              result.basePoints + result.bonusPoints
            );

            // Verify base points calculation
            const expectedBasePoints = Math.floor(amount * baseMultiplier);
            expect(result.basePoints).toBe(expectedBasePoints);

            // Verify bonus points calculation
            const expectedBonusPoints = Math.floor(amount * bonusMultiplier);
            expect(result.bonusPoints).toBe(expectedBonusPoints);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should apply amount rounding before calculating points", async () => {
      await fc.assert(
        fc.asyncProperty(
          paymentMethodArbitrary(),
          fc.double({ min: 1.1, max: 1000.9, noNaN: true }), // Amount with decimals
          fc.constantFrom("floor", "ceiling", "nearest", "floor5"),
          async (paymentMethod, amount, amountRoundingStrategy) => {
            const cardTypeId =
              cardTypeIdService.generateCardTypeIdFromPaymentMethod(
                paymentMethod
              );

            // Create mock repository
            const mockRepository = new MockRuleRepository();

            // Create a rule with amount rounding
            const rule: RewardRule = {
              id: crypto.randomUUID(),
              cardTypeId,
              name: "Amount Rounding Rule",
              description: "Rounds amount before calculation",
              enabled: true,
              priority: 1,
              conditions: [],
              reward: {
                calculationMethod: "standard",
                baseMultiplier: 1,
                bonusMultiplier: 0,
                pointsRoundingStrategy: "floor",
                amountRoundingStrategy: amountRoundingStrategy as
                  | "floor"
                  | "ceiling"
                  | "nearest"
                  | "floor5",
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
              transactionType: "purchase",
              date: DateTime.now(),
            };

            // Calculate rewards
            const result = await rewardService.calculateRewards(input);

            // Calculate expected rounded amount
            let roundedAmount = amount;
            switch (amountRoundingStrategy) {
              case "floor":
                roundedAmount = Math.floor(amount);
                break;
              case "ceiling":
                roundedAmount = Math.ceil(amount);
                break;
              case "nearest":
                roundedAmount = Math.round(amount);
                break;
              case "floor5":
                roundedAmount = Math.floor(amount / 5) * 5;
                break;
            }

            // Expected points = rounded amount * multiplier, then floored
            const expectedPoints = Math.floor(roundedAmount * 1);

            // Verify the calculation used the rounded amount
            expect(result.basePoints).toBe(expectedPoints);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
