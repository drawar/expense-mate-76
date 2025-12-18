import { RewardService } from "../src/core/rewards/RewardService";
import { RuleRepository } from "../src/core/rewards/RuleRepository";
import { CalculationInput, RewardRule } from "../src/core/rewards/types";
import { DateTime } from "luxon";

describe("RewardService - Converted Amount", () => {
  let rewardService: RewardService;
  let mockRuleRepository: jest.Mocked<RuleRepository>;

  beforeEach(() => {
    // Create mock rule repository
    mockRuleRepository = {
      getRulesForCardType: jest.fn(),
    } as any;

    rewardService = new RewardService(mockRuleRepository);
  });

  describe("Converted amount priority", () => {
    it("should use converted amount when provided", async () => {
      // Setup: Create a rule with 1x base multiplier and 9x bonus multiplier for online transactions
      // This matches the actual Citibank Rewards Visa Signature configuration
      const mockRule: RewardRule = {
        id: "test-rule-1",
        cardTypeId: "citibank-rewards-visa-signature",
        name: "Online Bonus",
        description: "10x total (1 base + 9 bonus) for online transactions",
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
          baseMultiplier: 1,
          bonusMultiplier: 9, // 9 bonus + 1 base = 10x total
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "floor",
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "Citi Points",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRuleRepository.getRulesForCardType.mockResolvedValue([mockRule]);

      // Test: Transaction of 700 CAD, but payment method charged 600 SGD
      const input: CalculationInput = {
        amount: 700, // Transaction amount in CAD
        currency: "CAD",
        convertedAmount: 600, // Actual charged amount in SGD
        convertedCurrency: "SGD",
        paymentMethod: {
          issuer: "Citibank",
          name: "Rewards Visa Signature",
          pointsCurrency: "Citi Points",
        },
        transactionType: "purchase",
        isOnline: true,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      // Verify: Points should be calculated based on 600 (converted amount), not 700
      // Base points: 600 * 1 = 600
      // Bonus points: 600 * 9 = 5,400
      // Total: 6,000 (10x total)
      expect(result.basePoints).toBe(600);
      expect(result.bonusPoints).toBe(5400);
      expect(result.totalPoints).toBe(6000);
    });

    it("should use transaction amount when no converted amount provided", async () => {
      const mockRule: RewardRule = {
        id: "test-rule-2",
        cardTypeId: "citibank-rewards-visa-signature",
        name: "Standard Rewards",
        description: "1x base rewards",
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
          pointsCurrency: "Citi Points",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRuleRepository.getRulesForCardType.mockResolvedValue([mockRule]);

      const input: CalculationInput = {
        amount: 700,
        currency: "CAD",
        // No convertedAmount provided
        paymentMethod: {
          issuer: "Citibank",
          name: "Rewards Visa Signature",
          pointsCurrency: "Citi Points",
        },
        transactionType: "purchase",
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      // Verify: Points should be calculated based on 700 (transaction amount)
      expect(result.basePoints).toBe(700);
      expect(result.totalPoints).toBe(700);
    });

    it("should apply bonus multiplier to converted amount", async () => {
      const mockRule: RewardRule = {
        id: "test-rule-3",
        cardTypeId: "citibank-rewards-visa-signature",
        name: "Online Bonus",
        description: "5x bonus for online transactions",
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
          baseMultiplier: 1,
          bonusMultiplier: 5,
          pointsRoundingStrategy: "floor",
          amountRoundingStrategy: "none",
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "Citi Points",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRuleRepository.getRulesForCardType.mockResolvedValue([mockRule]);

      const input: CalculationInput = {
        amount: 1000,
        currency: "CAD",
        convertedAmount: 800,
        convertedCurrency: "SGD",
        paymentMethod: {
          issuer: "Citibank",
          name: "Rewards Visa Signature",
          pointsCurrency: "Citi Points",
        },
        transactionType: "purchase",
        isOnline: true,
        date: DateTime.now(),
      };

      const result = await rewardService.calculateRewards(input);

      // Verify: Both base and bonus should use converted amount (800)
      // Base: 800 * 1 = 800
      // Bonus: 800 * 5 = 4000
      // Total: 4800
      expect(result.basePoints).toBe(800);
      expect(result.bonusPoints).toBe(4000);
      expect(result.totalPoints).toBe(4800);
    });
  });
});
