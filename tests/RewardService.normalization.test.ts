/**
 * Test for condition normalization in RewardService
 * Validates Requirements 3.1, 3.2, 3.3, 3.4
 */

import { RewardService } from "../src/core/rewards/RewardService";
import { RuleRepository } from "../src/core/rewards/RuleRepository";
import { CalculationInput, RuleCondition } from "../src/core/rewards/types";
import { DateTime } from "luxon";

describe("RewardService - Condition Normalization", () => {
  let rewardService: RewardService;
  let mockRepository: jest.Mocked<RuleRepository>;

  beforeEach(() => {
    mockRepository = {
      getRulesForCardType: jest.fn(),
      createRule: jest.fn(),
      updateRule: jest.fn(),
      deleteRule: jest.fn(),
      verifyConnection: jest.fn(),
      verifyAuthentication: jest.fn(),
    } as jest.Mocked<RuleRepository>;

    rewardService = new RewardService(mockRepository);
  });

  describe("Legacy 'online' condition normalization", () => {
    it("should convert online=true to transaction_type include online", async () => {
      // Create a rule with legacy "online" condition
      const legacyRule = {
        id: "test-rule-1",
        cardTypeId: "test-card",
        name: "Online Purchase Rule",
        description: "Rule for online purchases",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "online" as unknown as "transaction_type", // Legacy type
            operation: "equals" as const,
            values: ["true"],
          },
        ],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 2,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "floor" as const,
          amountRoundingStrategy: "none" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.getRulesForCardType.mockResolvedValue([legacyRule]);

      const input: CalculationInput = {
        amount: 100,
        currency: "CAD",
        paymentMethod: {
          issuer: "Test",
          name: "Card",
          pointsCurrency: "points",
        },
        transactionType: "online",
        isOnline: true,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      // Should apply the rule because isOnline=true matches the normalized condition
      expect(result.totalPoints).toBe(200); // 100 * 2
      expect(result.basePoints).toBe(200);
    });

    it("should convert online=false to transaction_type exclude online", async () => {
      // Create a rule with legacy "online" condition set to false
      const legacyRule = {
        id: "test-rule-2",
        cardTypeId: "test-card",
        name: "In-Store Purchase Rule",
        description: "Rule for in-store purchases",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "online" as unknown as "transaction_type", // Legacy type
            operation: "equals" as const,
            values: ["false"],
          },
        ],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 3,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "floor" as const,
          amountRoundingStrategy: "none" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.getRulesForCardType.mockResolvedValue([legacyRule]);

      const input: CalculationInput = {
        amount: 100,
        currency: "CAD",
        paymentMethod: {
          issuer: "Test",
          name: "Card",
          pointsCurrency: "points",
        },
        transactionType: "in_store",
        isOnline: false,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      // Should apply the rule because isOnline=false matches the normalized condition
      expect(result.totalPoints).toBe(300); // 100 * 3
      expect(result.basePoints).toBe(300);
    });

    it("should not apply online=true rule to offline transactions", async () => {
      const legacyRule = {
        id: "test-rule-3",
        cardTypeId: "test-card",
        name: "Online Only Rule",
        description: "Rule for online purchases only",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "online" as unknown as "transaction_type",
            operation: "equals" as const,
            values: ["true"],
          },
        ],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 2,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "floor" as const,
          amountRoundingStrategy: "none" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.getRulesForCardType.mockResolvedValue([legacyRule]);

      const input: CalculationInput = {
        amount: 100,
        currency: "CAD",
        paymentMethod: {
          issuer: "Test",
          name: "Card",
          pointsCurrency: "points",
        },
        transactionType: "in_store",
        isOnline: false,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      // Should NOT apply the rule because isOnline=false doesn't match
      expect(result.totalPoints).toBe(0);
      expect(result.messages).toContain(
        "No applicable reward rules found for this transaction"
      );
    });

    it("should preserve original intent when normalizing", async () => {
      // Test that both legacy and new format produce same results
      const legacyRule = {
        id: "legacy-rule",
        cardTypeId: "test-card",
        name: "Legacy Online Rule",
        description: "",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "online" as unknown as "transaction_type",
            operation: "equals" as const,
            values: ["true"],
          },
        ],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 2,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "floor" as const,
          amountRoundingStrategy: "none" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const modernRule = {
        ...legacyRule,
        id: "modern-rule",
        name: "Modern Online Rule",
        conditions: [
          {
            type: "transaction_type" as const,
            operation: "include" as const,
            values: ["online"],
          },
        ],
      };

      const input: CalculationInput = {
        amount: 100,
        currency: "CAD",
        paymentMethod: {
          issuer: "Test",
          name: "Card",
          pointsCurrency: "points",
        },
        transactionType: "online",
        isOnline: true,
        date: DateTime.now(),
      };

      // Test legacy rule
      mockRepository.getRulesForCardType.mockResolvedValue([legacyRule]);
      const legacyResult = await rewardService.calculateRewards(input);

      // Test modern rule
      mockRepository.getRulesForCardType.mockResolvedValue([modernRule]);
      const modernResult = await rewardService.calculateRewards(input);

      // Both should produce the same result
      expect(legacyResult.totalPoints).toBe(modernResult.totalPoints);
      expect(legacyResult.basePoints).toBe(modernResult.basePoints);
    });
  });
});
