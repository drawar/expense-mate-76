/**
 * Unit tests for RuleRepository initialization
 * Tests singleton behavior, initialization with Supabase client, and error handling
 * Requirements: 7.1, 7.2, 7.3
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  RuleRepository,
  initializeRuleRepository,
  getRuleRepository,
} from "../src/core/rewards/RuleRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { createMockSupabaseClient } from "./RuleRepository.test";
import { DbRewardRule } from "../src/core/rewards/types";

const mockRule: DbRewardRule = {
  id: "test-id",
  card_type_id: "test-card",
  name: "Test Rule",
  enabled: true,
  description: "Test",
  priority: 0,
  conditions: "[]",
  bonus_tiers: "[]",
  calculation_method: "standard",
  base_multiplier: 1,
  bonus_multiplier: 1,
  points_rounding_strategy: "floor",
  amount_rounding_strategy: "floor",
  block_size: 1,
  monthly_cap: null,
  monthly_min_spend: null,
  monthly_spend_period_type: null,
  points_currency: "Points",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("RuleRepository Initialization Unit Tests", () => {
  beforeEach(() => {
    // Reset singleton before each test to ensure clean state
    RuleRepository["resetInstance"]();
  });

  describe("Singleton Behavior", () => {
    it("should return the same instance when getInstance is called multiple times", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);
      const firstInstance = initializeRuleRepository(supabase);

      // Act
      const secondInstance = RuleRepository.getInstance();
      const thirdInstance = RuleRepository.getInstance();

      // Assert
      expect(secondInstance).toBe(firstInstance);
      expect(thirdInstance).toBe(firstInstance);
      expect(secondInstance).toBe(thirdInstance);
    });

    it("should return the same instance when initializeRuleRepository is called multiple times", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);

      // Act
      const firstInstance = initializeRuleRepository(supabase);
      const secondInstance = initializeRuleRepository(supabase);
      const thirdInstance = initializeRuleRepository(supabase);

      // Assert
      expect(secondInstance).toBe(firstInstance);
      expect(thirdInstance).toBe(firstInstance);
    });

    it("should return the same instance when using getRuleRepository helper", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);
      const initialInstance = initializeRuleRepository(supabase);

      // Act
      const retrievedInstance = getRuleRepository();

      // Assert
      expect(retrievedInstance).toBe(initialInstance);
    });

    it("should maintain singleton across mixed access patterns", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);

      // Act
      const instance1 = initializeRuleRepository(supabase);
      const instance2 = RuleRepository.getInstance();
      const instance3 = getRuleRepository();
      const instance4 = initializeRuleRepository(supabase);
      const instance5 = RuleRepository.getInstance();

      // Assert
      expect(instance2).toBe(instance1);
      expect(instance3).toBe(instance1);
      expect(instance4).toBe(instance1);
      expect(instance5).toBe(instance1);
    });
  });

  describe("Initialization with Supabase Client", () => {
    it("should successfully initialize with a valid Supabase client", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);

      // Act
      const repository = initializeRuleRepository(supabase);

      // Assert
      expect(repository).toBeDefined();
      expect(repository).toBeInstanceOf(RuleRepository);
      expect(repository.isSupabaseClientInitialized()).toBe(true);
    });

    it("should throw error when initialized with null client", () => {
      // Act & Assert
      expect(() => {
        initializeRuleRepository(null as unknown as SupabaseClient);
      }).toThrow("Supabase client is required to initialize RuleRepository");
    });

    it("should throw error when initialized with undefined client", () => {
      // Act & Assert
      expect(() => {
        initializeRuleRepository(undefined as unknown as SupabaseClient);
      }).toThrow("Supabase client is required to initialize RuleRepository");
    });

    it("should properly store the Supabase client for database operations", async () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);
      const repository = initializeRuleRepository(supabase);

      // Act
      const rules = await repository.getRulesForCardType("test-card");

      // Assert
      expect(rules).toBeDefined();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThanOrEqual(0);
    });

    it("should allow repository operations after successful initialization", async () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);
      const repository = initializeRuleRepository(supabase);

      // Act & Assert - should not throw
      await expect(
        repository.getRulesForCardType("test-card")
      ).resolves.toBeDefined();
      expect(repository.isSupabaseClientInitialized()).toBe(true);
    });
  });

  describe("Error Handling When Not Initialized", () => {
    it("should throw error when getInstance is called before initialization", () => {
      // Act & Assert
      expect(() => {
        RuleRepository.getInstance();
      }).toThrow("RuleRepository has not been initialized");
    });

    it("should throw error when getRuleRepository is called before initialization", () => {
      // Act & Assert
      expect(() => {
        getRuleRepository();
      }).toThrow("RuleRepository has not been initialized");
    });

    it("should provide clear error message about initialization requirement", () => {
      // Act & Assert
      expect(() => {
        RuleRepository.getInstance();
      }).toThrow(
        "Call initializeRuleRepository() with a Supabase client before accessing the repository"
      );
    });

    it("should throw error after resetInstance is called", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);
      initializeRuleRepository(supabase);

      // Act
      RuleRepository["resetInstance"]();

      // Assert
      expect(() => {
        RuleRepository.getInstance();
      }).toThrow("RuleRepository has not been initialized");
    });

    it("should allow re-initialization after reset", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);
      const firstInstance = initializeRuleRepository(supabase);

      // Act
      RuleRepository["resetInstance"]();
      const secondInstance = initializeRuleRepository(supabase);

      // Assert
      expect(secondInstance).toBeDefined();
      expect(secondInstance).not.toBe(firstInstance); // Different instance after reset
      expect(secondInstance.isSupabaseClientInitialized()).toBe(true);
    });
  });

  describe("Initialization State Management", () => {
    it("should report uninitialized state before initialization", () => {
      // Act & Assert
      expect(() => RuleRepository.getInstance()).toThrow();
    });

    it("should report initialized state after initialization", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);

      // Act
      const repository = initializeRuleRepository(supabase);

      // Assert
      expect(() => RuleRepository.getInstance()).not.toThrow();
      expect(repository.isSupabaseClientInitialized()).toBe(true);
    });

    it("should maintain initialized state across multiple getInstance calls", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);
      initializeRuleRepository(supabase);

      // Act & Assert
      expect(() => RuleRepository.getInstance()).not.toThrow();
      expect(() => RuleRepository.getInstance()).not.toThrow();
      expect(() => RuleRepository.getInstance()).not.toThrow();

      const instance = RuleRepository.getInstance();
      expect(instance.isSupabaseClientInitialized()).toBe(true);
    });

    it("should reset to uninitialized state after resetInstance", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);
      initializeRuleRepository(supabase);
      expect(() => RuleRepository.getInstance()).not.toThrow();

      // Act
      RuleRepository["resetInstance"]();

      // Assert
      expect(() => RuleRepository.getInstance()).toThrow(
        "RuleRepository has not been initialized"
      );
    });
  });

  describe("Integration with Helper Functions", () => {
    it("should work correctly with initializeRuleRepository helper", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);

      // Act
      const repository = initializeRuleRepository(supabase);

      // Assert
      expect(repository).toBeDefined();
      expect(repository.isSupabaseClientInitialized()).toBe(true);
    });

    it("should work correctly with getRuleRepository helper after initialization", () => {
      // Arrange
      const supabase = createMockSupabaseClient([mockRule]);
      const initializedRepo = initializeRuleRepository(supabase);

      // Act
      const retrievedRepo = getRuleRepository();

      // Assert
      expect(retrievedRepo).toBe(initializedRepo);
      expect(retrievedRepo.isSupabaseClientInitialized()).toBe(true);
    });

    it("should throw error with getRuleRepository helper before initialization", () => {
      // Act & Assert
      expect(() => {
        getRuleRepository();
      }).toThrow("RuleRepository has not been initialized");
    });
  });
});
