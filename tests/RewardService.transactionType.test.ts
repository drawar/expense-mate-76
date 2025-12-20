/**
 * Unit tests for transaction type condition evaluation
 * Tests the enhanced evaluateTransactionTypeCondition method
 */

import { RewardService } from "../src/core/rewards/RewardService";
import { RuleRepository } from "../src/core/rewards/RuleRepository";
import {
  CalculationInput,
  RewardRule,
  RuleCondition,
} from "../src/core/rewards/types";
import { DateTime } from "luxon";

describe("RewardService - Transaction Type Evaluation", () => {
  let rewardService: RewardService;
  let mockRepository: jest.Mocked<RuleRepository>;

  beforeEach(() => {
    // Create a mock repository
    mockRepository = {
      getRulesForCardType: jest.fn(),
    } as jest.Mocked<RuleRepository>;

    rewardService = new RewardService(mockRepository);
  });

  describe("Online transaction type", () => {
    it("should match online transaction when isOnline is true", async () => {
      const rule: RewardRule = {
        id: "test-rule",
        cardTypeId: "test-card",
        name: "Online Bonus",
        description: "Bonus for online transactions",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "transaction_type",
            operation: "include",
            values: ["online"],
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

      mockRepository.getRulesForCardType.mockResolvedValue([rule]);

      const input: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isOnline: true,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      expect(result.totalPoints).toBe(200); // 100 * 2
      expect(result.appliedRule).toBeDefined();
    });

    it("should not match online transaction when isOnline is false", async () => {
      const rule: RewardRule = {
        id: "test-rule",
        cardTypeId: "test-card",
        name: "Online Bonus",
        description: "Bonus for online transactions",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "transaction_type",
            operation: "include",
            values: ["online"],
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

      mockRepository.getRulesForCardType.mockResolvedValue([rule]);

      const input: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isOnline: false,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      expect(result.totalPoints).toBe(0);
      expect(result.appliedRule).toBeUndefined();
    });
  });

  describe("Contactless transaction type", () => {
    it("should match contactless transaction when isContactless is true", async () => {
      const rule: RewardRule = {
        id: "test-rule",
        cardTypeId: "test-card",
        name: "Contactless Bonus",
        description: "Bonus for contactless transactions",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "transaction_type",
            operation: "include",
            values: ["contactless"],
          },
        ],
        reward: {
          calculationMethod: "standard",
          baseMultiplier: 1.5,
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

      mockRepository.getRulesForCardType.mockResolvedValue([rule]);

      const input: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isContactless: true,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      expect(result.totalPoints).toBe(150); // 100 * 1.5
      expect(result.appliedRule).toBeDefined();
    });
  });

  describe("In-store transaction type", () => {
    it("should match in_store transaction when isOnline is false", async () => {
      const rule: RewardRule = {
        id: "test-rule",
        cardTypeId: "test-card",
        name: "In-Store Bonus",
        description: "Bonus for in-store transactions",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "transaction_type",
            operation: "include",
            values: ["in_store"],
          },
        ],
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
      };

      mockRepository.getRulesForCardType.mockResolvedValue([rule]);

      const input: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isOnline: false,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      expect(result.totalPoints).toBe(300); // 100 * 3
      expect(result.appliedRule).toBeDefined();
    });

    it("should not match in_store transaction when isOnline is true", async () => {
      const rule: RewardRule = {
        id: "test-rule",
        cardTypeId: "test-card",
        name: "In-Store Bonus",
        description: "Bonus for in-store transactions",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "transaction_type",
            operation: "include",
            values: ["in_store"],
          },
        ],
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
      };

      mockRepository.getRulesForCardType.mockResolvedValue([rule]);

      const input: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isOnline: true,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      expect(result.totalPoints).toBe(0);
      expect(result.appliedRule).toBeUndefined();
    });
  });

  describe("Exclude operation", () => {
    it("should exclude online transactions", async () => {
      const rule: RewardRule = {
        id: "test-rule",
        cardTypeId: "test-card",
        name: "Offline Only",
        description: "Bonus for non-online transactions",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "transaction_type",
            operation: "exclude",
            values: ["online"],
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

      mockRepository.getRulesForCardType.mockResolvedValue([rule]);

      // Should match when isOnline is false
      const input1: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isOnline: false,
        date: DateTime.now(),
      };

      const result1 = await rewardService.calculateRewards(input1);
      expect(result1.totalPoints).toBe(200);

      // Should not match when isOnline is true
      const input2: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isOnline: true,
        date: DateTime.now(),
      };

      const result2 = await rewardService.calculateRewards(input2);
      expect(result2.totalPoints).toBe(0);
    });
  });

  describe("Equals operation", () => {
    it("should match with equals operation", async () => {
      const rule: RewardRule = {
        id: "test-rule",
        cardTypeId: "test-card",
        name: "Contactless Only",
        description: "Bonus for contactless only",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "transaction_type",
            operation: "equals",
            values: ["contactless"],
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

      mockRepository.getRulesForCardType.mockResolvedValue([rule]);

      const input: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isContactless: true,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);
      expect(result.totalPoints).toBe(200);
    });
  });

  describe("Multiple transaction types with include", () => {
    it("should match any of the included types", async () => {
      const rule: RewardRule = {
        id: "test-rule",
        cardTypeId: "test-card",
        name: "Online or Contactless",
        description: "Bonus for online or contactless",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "transaction_type",
            operation: "include",
            values: ["online", "contactless"],
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

      mockRepository.getRulesForCardType.mockResolvedValue([rule]);

      // Should match online
      const input1: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isOnline: true,
        date: DateTime.now(),
      };

      const result1 = await rewardService.calculateRewards(input1);
      expect(result1.totalPoints).toBe(200);

      // Should match contactless
      const input2: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isContactless: true,
        date: DateTime.now(),
      };

      const result2 = await rewardService.calculateRewards(input2);
      expect(result2.totalPoints).toBe(200);

      // Should not match in-store
      const input3: CalculationInput = {
        amount: 100,
        currency: "USD",
        paymentMethod: {
          issuer: "test",
          name: "card",
          pointsCurrency: "points",
        },
        transactionType: "purchase",
        isOnline: false,
        isContactless: false,
        date: DateTime.now(),
      };

      const result3 = await rewardService.calculateRewards(input3);
      expect(result3.totalPoints).toBe(0);
    });
  });
});
