/**
 * Unit Tests for RewardService
 *
 * Tests specific examples, edge cases, and tiered rewards
 */

import { RewardService } from "../src/core/rewards/RewardService";
import { RuleRepository } from "../src/core/rewards/RuleRepository";
import {
  RewardRule,
  CalculationInput,
  BonusTier,
} from "../src/core/rewards/types";
import { cardTypeIdService } from "../src/core/rewards/CardTypeIdService";
import { DateTime } from "luxon";

// Mock repository
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

describe("RewardService Unit Tests", () => {
  let mockRepository: MockRuleRepository;
  let rewardService: RewardService;

  beforeEach(() => {
    mockRepository = new MockRuleRepository();
    rewardService = new RewardService(
      mockRepository as unknown as RuleRepository
    );
  });

  describe("Edge Cases", () => {
    it("should handle zero amount transactions", async () => {
      const paymentMethod = {
        id: "test-card",
        issuer: "Test Bank",
        name: "Test Card",
        pointsCurrency: "points",
      };

      const cardTypeId =
        cardTypeIdService.generateCardTypeIdFromPaymentMethod(paymentMethod);

      const rule: RewardRule = {
        id: "rule-1",
        cardTypeId,
        name: "Test Rule",
        description: "Test",
        enabled: true,
        priority: 1,
        conditions: [],
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

      const input: CalculationInput = {
        amount: 0,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      expect(result.totalPoints).toBe(0);
      expect(result.basePoints).toBe(0);
      expect(result.bonusPoints).toBe(0);
    });

    it("should handle negative amounts", async () => {
      const paymentMethod = {
        id: "test-card",
        issuer: "Test Bank",
        name: "Test Card",
        pointsCurrency: "points",
      };

      const cardTypeId =
        cardTypeIdService.generateCardTypeIdFromPaymentMethod(paymentMethod);

      const rule: RewardRule = {
        id: "rule-1",
        cardTypeId,
        name: "Test Rule",
        description: "Test",
        enabled: true,
        priority: 1,
        conditions: [],
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

      const input: CalculationInput = {
        amount: -100,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      // Negative amounts should result in negative points (for refunds)
      expect(result.totalPoints).toBeLessThan(0);
    });

    it("should return zero points when no rules exist", async () => {
      const paymentMethod = {
        id: "test-card",
        issuer: "Test Bank",
        name: "Test Card",
        pointsCurrency: "points",
      };

      const cardTypeId =
        cardTypeIdService.generateCardTypeIdFromPaymentMethod(paymentMethod);

      // No rules set for this card type

      const input: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      expect(result.totalPoints).toBe(0);
      expect(result.basePoints).toBe(0);
      expect(result.bonusPoints).toBe(0);
      expect(result.messages).toContain(
        "No reward rules found for this payment method"
      );
    });
  });

  describe("Tiered Rewards", () => {
    it("should apply correct tier based on transaction amount", async () => {
      const paymentMethod = {
        id: "test-card",
        issuer: "Test Bank",
        name: "Test Card",
        pointsCurrency: "points",
      };

      const cardTypeId =
        cardTypeIdService.generateCardTypeIdFromPaymentMethod(paymentMethod);

      const tiers: BonusTier[] = [
        {
          minAmount: 0,
          maxAmount: 100,
          multiplier: 1,
          priority: 1,
        },
        {
          minAmount: 100,
          maxAmount: 500,
          multiplier: 2,
          priority: 2,
        },
        {
          minAmount: 500,
          multiplier: 3,
          priority: 3,
        },
      ];

      const rule: RewardRule = {
        id: "rule-1",
        cardTypeId,
        name: "Tiered Rule",
        description: "Has tiered rewards",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "tiered",
          baseMultiplier: 0,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          bonusTiers: tiers,
          pointsCurrency: "points",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.setRulesForCardType(cardTypeId, [rule]);

      // Test tier 1 (0-100)
      const input1: CalculationInput = {
        amount: 50,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
      };

      const result1 = await rewardService.calculateRewards(input1);
      expect(result1.bonusPoints).toBe(50); // 50 * 1

      // Test tier 2 (100-500)
      const input2: CalculationInput = {
        amount: 200,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
      };

      const result2 = await rewardService.calculateRewards(input2);
      expect(result2.bonusPoints).toBe(400); // 200 * 2

      // Test tier 3 (500+)
      const input3: CalculationInput = {
        amount: 1000,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
      };

      const result3 = await rewardService.calculateRewards(input3);
      expect(result3.bonusPoints).toBe(3000); // 1000 * 3
    });

    it("should apply tier with monthly spend requirement", async () => {
      const paymentMethod = {
        id: "test-card",
        issuer: "Test Bank",
        name: "Test Card",
        pointsCurrency: "points",
      };

      const cardTypeId =
        cardTypeIdService.generateCardTypeIdFromPaymentMethod(paymentMethod);

      const tiers: BonusTier[] = [
        {
          minSpend: 0,
          maxSpend: 1000,
          multiplier: 1,
          priority: 1,
        },
        {
          minSpend: 1000,
          multiplier: 2,
          priority: 2,
        },
      ];

      const rule: RewardRule = {
        id: "rule-1",
        cardTypeId,
        name: "Spend-Based Tier Rule",
        description: "Tiers based on monthly spend",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "tiered",
          baseMultiplier: 0,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          bonusTiers: tiers,
          pointsCurrency: "points",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.setRulesForCardType(cardTypeId, [rule]);

      // Test with low monthly spend (tier 1)
      const input1: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
        monthlySpend: 500,
      };

      const result1 = await rewardService.calculateRewards(input1);
      expect(result1.bonusPoints).toBe(100); // 100 * 1

      // Test with high monthly spend (tier 2)
      const input2: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
        monthlySpend: 1500,
      };

      const result2 = await rewardService.calculateRewards(input2);
      expect(result2.bonusPoints).toBe(200); // 100 * 2
    });
  });

  describe("Specific Calculation Examples", () => {
    it("should calculate 1 point per dollar with floor rounding", async () => {
      const paymentMethod = {
        id: "test-card",
        issuer: "Test Bank",
        name: "Test Card",
        pointsCurrency: "points",
      };

      const cardTypeId =
        cardTypeIdService.generateCardTypeIdFromPaymentMethod(paymentMethod);

      const rule: RewardRule = {
        id: "rule-1",
        cardTypeId,
        name: "1x Points",
        description: "1 point per dollar",
        enabled: true,
        priority: 1,
        conditions: [],
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

      const input: CalculationInput = {
        amount: 123.45,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      expect(result.basePoints).toBe(123); // Floor of 123.45
      expect(result.totalPoints).toBe(123);
    });

    it("should calculate 2x points with bonus multiplier", async () => {
      const paymentMethod = {
        id: "test-card",
        issuer: "Test Bank",
        name: "Test Card",
        pointsCurrency: "points",
      };

      const cardTypeId =
        cardTypeIdService.generateCardTypeIdFromPaymentMethod(paymentMethod);

      const rule: RewardRule = {
        id: "rule-1",
        cardTypeId,
        name: "2x Points",
        description: "1 base + 1 bonus per dollar",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1,
          bonusMultiplier: 1,
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

      const input: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod,
        transactionType: "purchase",
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      expect(result.basePoints).toBe(100);
      expect(result.bonusPoints).toBe(100);
      expect(result.totalPoints).toBe(200);
    });
  });
});
