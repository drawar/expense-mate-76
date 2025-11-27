/**
 * End-to-End Tests for Reward Rule CRUD Operations
 *
 * These tests verify the complete flow of reward rule management through
 * the application, including UI interactions, database persistence, and
 * reward calculation scenarios.
 *
 * **Feature: codebase-improvements**
 * Tests Requirements: 1.2, 1.3, 1.4, 5.5
 */

import {
  RuleRepository,
  initializeRuleRepository,
} from "@/core/rewards/RuleRepository";
import { RewardService } from "@/core/rewards/RewardService";
import { RewardRule, CalculationInput } from "@/core/rewards/types";
import { supabase } from "@/integrations/supabase/client";
import { DateTime } from "luxon";

describe("Reward Rules End-to-End Tests", () => {
  let repository: RuleRepository;
  let rewardService: RewardService;
  const testCardTypeId = `test-e2e-${Date.now()}`;
  const createdRuleIds: string[] = [];

  beforeAll(() => {
    // Initialize services
    repository = initializeRuleRepository(supabase);
    rewardService = new RewardService(repository);
  });

  afterAll(async () => {
    // Cleanup: Delete all test rules created during tests
    for (const ruleId of createdRuleIds) {
      try {
        await repository.deleteRule(ruleId);
      } catch (error) {
        console.warn(`Failed to cleanup rule ${ruleId}:`, error);
      }
    }
  });

  describe("Test Case 1: CREATE - Add a New Reward Rule (Requirement 1.2)", () => {
    it("should create a new reward rule and persist it to the database", async () => {
      // Arrange: Prepare test rule data
      const newRule = {
        cardTypeId: testCardTypeId,
        name: "E2E Test - Grocery Bonus",
        description: "5x points on grocery purchases",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "mcc" as const,
            operation: "include" as const,
            values: ["5411"], // Grocery Stores
          },
        ],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 1,
          bonusMultiplier: 4, // Total 5x
          pointsRoundingStrategy: "nearest" as const,
          amountRoundingStrategy: "floor" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
      };

      // Act: Create the rule
      const createdRule = await repository.createRule(newRule);
      createdRuleIds.push(createdRule.id);

      // Assert: Verify rule was created with correct properties
      expect(createdRule).toBeDefined();
      expect(createdRule.id).toBeDefined();
      expect(createdRule.name).toBe("E2E Test - Grocery Bonus");
      expect(createdRule.cardTypeId).toBe(testCardTypeId);
      expect(createdRule.enabled).toBe(true);
      expect(createdRule.priority).toBe(1);
      expect(createdRule.conditions).toHaveLength(1);
      expect(createdRule.conditions[0].type).toBe("mcc");
      expect(createdRule.conditions[0].values).toContain("5411");
    });

    it("should persist the created rule in the database", async () => {
      // Act: Retrieve rules from database
      const rules = await repository.getRulesForCardType(testCardTypeId);

      // Assert: Verify the rule exists in database
      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThan(0);

      const groceryRule = rules.find(
        (r) => r.name === "E2E Test - Grocery Bonus"
      );
      expect(groceryRule).toBeDefined();
      expect(groceryRule?.description).toBe("5x points on grocery purchases");
    });
  });

  describe("Test Case 2: READ - Verify Rule Persistence (Requirement 1.2)", () => {
    it("should retrieve the same rule data after creation", async () => {
      // Arrange: Get the rule ID from previous test
      const rules = await repository.getRulesForCardType(testCardTypeId);
      const groceryRule = rules.find(
        (r) => r.name === "E2E Test - Grocery Bonus"
      );
      expect(groceryRule).toBeDefined();

      // Act: Retrieve rules again (simulating page refresh)
      const refreshedRules =
        await repository.getRulesForCardType(testCardTypeId);
      const refreshedGroceryRule = refreshedRules.find(
        (r) => r.id === groceryRule!.id
      );

      // Assert: Verify all data persisted correctly
      expect(refreshedGroceryRule).toBeDefined();
      expect(refreshedGroceryRule?.id).toBe(groceryRule!.id);
      expect(refreshedGroceryRule?.name).toBe(groceryRule!.name);
      expect(refreshedGroceryRule?.description).toBe(groceryRule!.description);
      expect(refreshedGroceryRule?.priority).toBe(groceryRule!.priority);
      expect(refreshedGroceryRule?.enabled).toBe(groceryRule!.enabled);
      expect(refreshedGroceryRule?.conditions).toEqual(groceryRule!.conditions);
    });
  });

  describe("Test Case 3: UPDATE - Edit an Existing Reward Rule (Requirement 1.3)", () => {
    it("should update a reward rule and persist changes", async () => {
      // Arrange: Get the existing rule
      const rules = await repository.getRulesForCardType(testCardTypeId);
      const ruleToUpdate = rules.find(
        (r) => r.name === "E2E Test - Grocery Bonus"
      );
      expect(ruleToUpdate).toBeDefined();

      // Act: Update the rule
      const updatedRule: RewardRule = {
        ...ruleToUpdate!,
        name: "E2E Test - Updated Grocery Bonus",
        description: "10x points on grocery purchases - updated",
        priority: 2,
      };
      await repository.updateRule(updatedRule);

      // Assert: Verify changes persisted
      const rulesAfterUpdate =
        await repository.getRulesForCardType(testCardTypeId);
      const verifiedRule = rulesAfterUpdate.find(
        (r) => r.id === ruleToUpdate!.id
      );

      expect(verifiedRule).toBeDefined();
      expect(verifiedRule?.name).toBe("E2E Test - Updated Grocery Bonus");
      expect(verifiedRule?.description).toBe(
        "10x points on grocery purchases - updated"
      );
      expect(verifiedRule?.priority).toBe(2);
      expect(verifiedRule?.id).toBe(ruleToUpdate!.id); // ID should not change
    });

    it("should maintain updated data after simulated page refresh", async () => {
      // Act: Retrieve rules again (simulating page refresh)
      const rules = await repository.getRulesForCardType(testCardTypeId);
      const updatedRule = rules.find(
        (r) => r.name === "E2E Test - Updated Grocery Bonus"
      );

      // Assert: Verify updates persisted
      expect(updatedRule).toBeDefined();
      expect(updatedRule?.description).toBe(
        "10x points on grocery purchases - updated"
      );
      expect(updatedRule?.priority).toBe(2);
    });
  });

  describe("Test Case 4: DELETE - Remove a Reward Rule (Requirement 1.4)", () => {
    let ruleIdToDelete: string;

    beforeAll(async () => {
      // Create a rule specifically for deletion test
      const ruleToDelete = await repository.createRule({
        cardTypeId: testCardTypeId,
        name: "E2E Test - Rule to Delete",
        description: "This rule will be deleted",
        enabled: true,
        priority: 99,
        conditions: [],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 1,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "nearest" as const,
          amountRoundingStrategy: "floor" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
      });
      ruleIdToDelete = ruleToDelete.id;
      createdRuleIds.push(ruleIdToDelete);
    });

    it("should delete a reward rule from the database", async () => {
      // Arrange: Verify rule exists before deletion
      const rulesBefore = await repository.getRulesForCardType(testCardTypeId);
      const ruleBeforeDelete = rulesBefore.find((r) => r.id === ruleIdToDelete);
      expect(ruleBeforeDelete).toBeDefined();

      // Act: Delete the rule
      await repository.deleteRule(ruleIdToDelete);

      // Assert: Verify rule no longer exists
      const rulesAfter = await repository.getRulesForCardType(testCardTypeId);
      const ruleAfterDelete = rulesAfter.find((r) => r.id === ruleIdToDelete);
      expect(ruleAfterDelete).toBeUndefined();
    });

    it("should maintain deletion after simulated page refresh", async () => {
      // Act: Retrieve rules again (simulating page refresh)
      const rules = await repository.getRulesForCardType(testCardTypeId);
      const deletedRule = rules.find((r) => r.id === ruleIdToDelete);

      // Assert: Verify rule is still deleted
      expect(deletedRule).toBeUndefined();
    });
  });

  describe("Test Case 5: Multiple Rules Management", () => {
    const multipleRuleIds: string[] = [];

    it("should create multiple reward rules", async () => {
      // Arrange: Prepare multiple rules
      const rulesToCreate = [
        {
          name: "E2E Test - Dining Bonus",
          mcc: "5812", // Restaurants
          bonusMultiplier: 2,
        },
        {
          name: "E2E Test - Gas Bonus",
          mcc: "5541", // Gas Stations
          bonusMultiplier: 3,
        },
        {
          name: "E2E Test - Travel Bonus",
          mcc: "4511", // Airlines
          bonusMultiplier: 4,
        },
      ];

      // Act: Create all rules
      for (const ruleData of rulesToCreate) {
        const rule = await repository.createRule({
          cardTypeId: testCardTypeId,
          name: ruleData.name,
          description: `Test rule for ${ruleData.name}`,
          enabled: true,
          priority: 10,
          conditions: [
            {
              type: "mcc" as const,
              operation: "include" as const,
              values: [ruleData.mcc],
            },
          ],
          reward: {
            calculationMethod: "standard" as const,
            baseMultiplier: 1,
            bonusMultiplier: ruleData.bonusMultiplier,
            pointsRoundingStrategy: "nearest" as const,
            amountRoundingStrategy: "floor" as const,
            blockSize: 1,
            bonusTiers: [],
            pointsCurrency: "points",
          },
        });
        multipleRuleIds.push(rule.id);
        createdRuleIds.push(rule.id);
      }

      // Assert: Verify all rules were created
      expect(multipleRuleIds).toHaveLength(3);

      const allRules = await repository.getRulesForCardType(testCardTypeId);
      const createdRules = allRules.filter((r) =>
        multipleRuleIds.includes(r.id)
      );
      expect(createdRules).toHaveLength(3);
    });

    it("should update one rule without affecting others", async () => {
      // Arrange: Get the dining rule
      const rules = await repository.getRulesForCardType(testCardTypeId);
      const diningRule = rules.find(
        (r) => r.name === "E2E Test - Dining Bonus"
      );
      expect(diningRule).toBeDefined();

      // Act: Update only the dining rule
      const updatedDiningRule: RewardRule = {
        ...diningRule!,
        priority: 5,
      };
      await repository.updateRule(updatedDiningRule);

      // Assert: Verify only dining rule was updated
      const rulesAfterUpdate =
        await repository.getRulesForCardType(testCardTypeId);
      const verifiedDiningRule = rulesAfterUpdate.find(
        (r) => r.id === diningRule!.id
      );
      const gasRule = rulesAfterUpdate.find(
        (r) => r.name === "E2E Test - Gas Bonus"
      );
      const travelRule = rulesAfterUpdate.find(
        (r) => r.name === "E2E Test - Travel Bonus"
      );

      expect(verifiedDiningRule?.priority).toBe(5);
      expect(gasRule?.priority).toBe(10); // Unchanged
      expect(travelRule?.priority).toBe(10); // Unchanged
    });

    it("should delete one rule without affecting others", async () => {
      // Arrange: Get the gas rule
      const rules = await repository.getRulesForCardType(testCardTypeId);
      const gasRule = rules.find((r) => r.name === "E2E Test - Gas Bonus");
      expect(gasRule).toBeDefined();

      // Act: Delete the gas rule
      await repository.deleteRule(gasRule!.id);

      // Assert: Verify only gas rule was deleted
      const rulesAfterDelete =
        await repository.getRulesForCardType(testCardTypeId);
      const deletedGasRule = rulesAfterDelete.find((r) => r.id === gasRule!.id);
      const diningRule = rulesAfterDelete.find(
        (r) => r.name === "E2E Test - Dining Bonus"
      );
      const travelRule = rulesAfterDelete.find(
        (r) => r.name === "E2E Test - Travel Bonus"
      );

      expect(deletedGasRule).toBeUndefined();
      expect(diningRule).toBeDefined();
      expect(travelRule).toBeDefined();
    });
  });

  describe("Test Case 6: Reward Calculation Scenarios (Requirement 5.5)", () => {
    let calculationTestRuleId: string;

    beforeAll(async () => {
      // Create a rule for calculation testing
      const rule = await repository.createRule({
        cardTypeId: testCardTypeId,
        name: "E2E Test - Calculation Rule",
        description: "3x points on dining",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "mcc" as const,
            operation: "include" as const,
            values: ["5812"], // Restaurants
          },
        ],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 1,
          bonusMultiplier: 2, // Total 3x
          pointsRoundingStrategy: "nearest" as const,
          amountRoundingStrategy: "floor" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
      });
      calculationTestRuleId = rule.id;
      createdRuleIds.push(calculationTestRuleId);
    });

    it("should calculate points correctly for matching transaction", async () => {
      // Arrange: Create a transaction input
      const transactionInput: CalculationInput = {
        amount: 100,
        currency: "CAD",
        paymentMethod: {
          issuer: "test-issuer",
          name: "test-card",
          pointsCurrency: "points",
        },
        mcc: "5812", // Restaurant
        merchantName: "Test Restaurant",
        transactionType: "purchase",
        isOnline: false,
        isContactless: false,
        date: DateTime.now(),
      };

      // Act: Calculate points
      const result = await rewardService.calculateRewards(transactionInput);

      // Assert: Verify calculation
      expect(result).toBeDefined();
      expect(result.totalPoints).toBe(300); // 100 * 3x
      expect(result.appliedRule).toBeDefined();
      expect(result.appliedRule?.name).toBe("E2E Test - Calculation Rule");
    });

    it("should not apply rule for non-matching transaction", async () => {
      // Arrange: Create a transaction that doesn't match
      const transactionInput: CalculationInput = {
        amount: 100,
        currency: "CAD",
        paymentMethod: {
          issuer: "test-issuer",
          name: "test-card",
          pointsCurrency: "points",
        },
        mcc: "5411", // Grocery (doesn't match rule)
        merchantName: "Test Grocery",
        transactionType: "purchase",
        isOnline: false,
        isContactless: false,
        date: DateTime.now(),
      };

      // Act: Calculate points
      const result = await rewardService.calculateRewards(transactionInput);

      // Assert: Verify no bonus applied
      expect(result).toBeDefined();
      // Should only get base points (1x) since no rule matches
      expect(result.totalPoints).toBeLessThan(300);
    });

    it("should handle tiered rewards correctly", async () => {
      // Arrange: Create a rule with tiered rewards
      const tieredRule = await repository.createRule({
        cardTypeId: testCardTypeId,
        name: "E2E Test - Tiered Rule",
        description: "Tiered rewards based on spend",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "mcc" as const,
            operation: "include" as const,
            values: ["5411"], // Grocery
          },
        ],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 1,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "nearest" as const,
          amountRoundingStrategy: "floor" as const,
          blockSize: 1,
          bonusTiers: [
            {
              minSpend: 0,
              maxSpend: 50,
              multiplier: 2,
            },
            {
              minSpend: 50,
              maxSpend: null,
              multiplier: 5,
            },
          ],
          pointsCurrency: "points",
        },
      });
      createdRuleIds.push(tieredRule.id);

      // Act: Test with amount below threshold
      const lowAmountInput: CalculationInput = {
        amount: 30,
        currency: "CAD",
        paymentMethod: {
          issuer: "test-issuer",
          name: "test-card",
          pointsCurrency: "points",
        },
        mcc: "5411",
        merchantName: "Test Grocery",
        transactionType: "purchase",
        isOnline: false,
        isContactless: false,
        date: DateTime.now(),
      };
      const lowAmountResult =
        await rewardService.calculateRewards(lowAmountInput);

      // Act: Test with amount above threshold
      const highAmountInput: CalculationInput = {
        amount: 100,
        currency: "CAD",
        paymentMethod: {
          issuer: "test-issuer",
          name: "test-card",
          pointsCurrency: "points",
        },
        mcc: "5411",
        merchantName: "Test Grocery",
        transactionType: "purchase",
        isOnline: false,
        isContactless: false,
        date: DateTime.now(),
      };
      const highAmountResult =
        await rewardService.calculateRewards(highAmountInput);

      // Assert: Verify tiered calculation
      expect(lowAmountResult.totalPoints).toBe(60); // 30 * 2x
      expect(highAmountResult.totalPoints).toBe(500); // 100 * 5x
    });
  });

  describe("Test Case 7: Error Handling and Edge Cases", () => {
    it("should handle invalid card type ID gracefully", async () => {
      // Act: Try to get rules for non-existent card type
      const rules = await repository.getRulesForCardType(
        "non-existent-card-type"
      );

      // Assert: Should return empty array, not throw error
      expect(rules).toBeDefined();
      expect(rules).toEqual([]);
    });

    it("should handle deletion of non-existent rule", async () => {
      // Act & Assert: Should not throw error
      await expect(
        repository.deleteRule("non-existent-rule-id")
      ).resolves.not.toThrow();
    });

    it("should validate required fields on create", async () => {
      // Arrange: Create rule with missing required field
      const invalidRule = {
        cardTypeId: testCardTypeId,
        name: "", // Empty name (invalid)
        description: "Test",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 1,
          bonusMultiplier: 0,
          pointsRoundingStrategy: "nearest" as const,
          amountRoundingStrategy: "floor" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
      };

      // Act & Assert: Should throw validation error
      await expect(repository.createRule(invalidRule)).rejects.toThrow();
    });

    it("should handle disabled rules correctly", async () => {
      // Arrange: Create a disabled rule
      const disabledRule = await repository.createRule({
        cardTypeId: testCardTypeId,
        name: "E2E Test - Disabled Rule",
        description: "This rule is disabled",
        enabled: false, // Disabled
        priority: 1,
        conditions: [
          {
            type: "mcc" as const,
            operation: "include" as const,
            values: ["5999"],
          },
        ],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 1,
          bonusMultiplier: 10,
          pointsRoundingStrategy: "nearest" as const,
          amountRoundingStrategy: "floor" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
      });
      createdRuleIds.push(disabledRule.id);

      // Act: Try to calculate points with disabled rule
      const transactionInput: CalculationInput = {
        amount: 100,
        currency: "CAD",
        paymentMethod: {
          issuer: "test-issuer",
          name: "test-card",
          pointsCurrency: "points",
        },
        mcc: "5999",
        merchantName: "Test Merchant",
        transactionType: "purchase",
        isOnline: false,
        isContactless: false,
        date: DateTime.now(),
      };
      const result = await rewardService.calculateRewards(transactionInput);

      // Assert: Disabled rule should not be applied
      expect(result.appliedRule?.id).not.toBe(disabledRule.id);
    });
  });
});
