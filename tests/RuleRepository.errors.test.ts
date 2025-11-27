/**
 * Tests for RuleRepository error handling
 * Verifies that the repository properly throws and handles errors
 * Requirements: 6.1, 6.2
 */

import {
  RuleRepository,
  initializeRuleRepository,
} from "../src/core/rewards/RuleRepository";
import {
  AuthenticationError,
  ValidationError,
  PersistenceError,
} from "../src/core/rewards/errors";
import { RewardRule } from "../src/core/rewards/types";
import { SupabaseClient } from "@supabase/supabase-js";

// Helper to create a valid reward config
const createValidRewardConfig = () => ({
  calculationMethod: "standard" as const,
  baseMultiplier: 1,
  bonusMultiplier: 0,
  pointsRoundingStrategy: "floor" as const,
  amountRoundingStrategy: "none" as const,
  pointsCurrency: "points",
  blockSize: 1,
  bonusTiers: [],
});

// Mock Supabase client
const createMockSupabaseClient = (
  overrides: Partial<{
    auth: Partial<{ getSession: jest.Mock }>;
    from: jest.Mock;
  }> = {}
) => {
  const defaultAuth = {
    getSession: jest.fn().mockResolvedValue({
      data: { session: { user: { id: "test-user-id" } } },
      error: null,
    }),
  };

  const defaultFrom = jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  });

  return {
    auth: { ...defaultAuth, ...overrides.auth },
    from: overrides.from || defaultFrom,
  } as unknown as SupabaseClient;
};

describe("RuleRepository Error Handling", () => {
  let repository: RuleRepository;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    // Reset singleton instance
    RuleRepository.resetInstance();
  });

  describe("Authentication Errors", () => {
    it("should throw AuthenticationError when user is not authenticated", async () => {
      mockSupabase = createMockSupabaseClient({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
        },
      });

      repository = initializeRuleRepository(mockSupabase);

      await expect(repository.getRulesForCardType("test-card")).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should throw AuthenticationError when session check fails", async () => {
      const sessionError = new Error("Session check failed");
      mockSupabase = createMockSupabaseClient({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: sessionError,
          }),
        },
      });

      repository = initializeRuleRepository(mockSupabase);

      await expect(repository.getRulesForCardType("test-card")).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should include operation name in AuthenticationError", async () => {
      mockSupabase = createMockSupabaseClient({
        auth: {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
        },
      });

      repository = initializeRuleRepository(mockSupabase);

      try {
        await repository.createRule({
          cardTypeId: "test-card",
          name: "Test Rule",
          description: "Test",
          enabled: true,
          priority: 1,
          conditions: [],
          reward: createValidRewardConfig(),
        });
        fail("Should have thrown AuthenticationError");
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
        expect((error as AuthenticationError).operation).toBe("createRule");
      }
    });
  });

  describe("Validation Errors", () => {
    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
      repository = initializeRuleRepository(mockSupabase);
    });

    it("should throw ValidationError when rule name is missing", async () => {
      await expect(
        repository.createRule({
          cardTypeId: "test-card",
          name: "",
          description: "Test",
          enabled: true,
          priority: 1,
          conditions: [],
          reward: createValidRewardConfig(),
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when cardTypeId is missing", async () => {
      await expect(
        repository.createRule({
          cardTypeId: "",
          name: "Test Rule",
          description: "Test",
          enabled: true,
          priority: 1,
          conditions: [],
          reward: createValidRewardConfig(),
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError when priority is negative", async () => {
      await expect(
        repository.createRule({
          cardTypeId: "test-card",
          name: "Test Rule",
          description: "Test",
          enabled: true,
          priority: -1,
          conditions: [],
          reward: createValidRewardConfig(),
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should include field name in ValidationError", async () => {
      try {
        await repository.createRule({
          cardTypeId: "test-card",
          name: "",
          description: "Test",
          enabled: true,
          priority: 1,
          conditions: [],
          reward: createValidRewardConfig(),
        });
        fail("Should have thrown ValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe("name");
      }
    });

    it("should throw ValidationError when cardTypeId is empty in getRulesForCardType", async () => {
      await expect(repository.getRulesForCardType("")).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError when rule ID is missing in updateRule", async () => {
      const rule: RewardRule = {
        id: "",
        cardTypeId: "test-card",
        name: "Test Rule",
        description: "Test",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: createValidRewardConfig(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(repository.updateRule(rule)).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError when rule ID is missing in deleteRule", async () => {
      await expect(repository.deleteRule("")).rejects.toThrow(ValidationError);
    });
  });

  describe("Persistence Errors", () => {
    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
      repository = initializeRuleRepository(mockSupabase);
    });

    it("should throw PersistenceError when database query fails", async () => {
      const dbError = new Error("Database connection failed");
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: dbError,
        }),
      });

      await expect(repository.getRulesForCardType("test-card")).rejects.toThrow(
        PersistenceError
      );
    });

    it("should throw PersistenceError when insert fails", async () => {
      const dbError = new Error("Insert failed");
      mockSupabase.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: dbError,
        }),
      });

      await expect(
        repository.createRule({
          cardTypeId: "test-card",
          name: "Test Rule",
          description: "Test",
          enabled: true,
          priority: 1,
          conditions: [],
          reward: createValidRewardConfig(),
        })
      ).rejects.toThrow(PersistenceError);
    });

    it("should throw PersistenceError when update fails", async () => {
      const dbError = new Error("Update failed");
      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: dbError,
        }),
      });

      const rule: RewardRule = {
        id: "test-id",
        cardTypeId: "test-card",
        name: "Test Rule",
        description: "Test",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: createValidRewardConfig(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(repository.updateRule(rule)).rejects.toThrow(
        PersistenceError
      );
    });

    it("should throw PersistenceError when delete fails", async () => {
      const dbError = new Error("Delete failed");
      mockSupabase.from = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: null,
          error: dbError,
        }),
      });

      await expect(repository.deleteRule("test-id")).rejects.toThrow(
        PersistenceError
      );
    });

    it("should throw PersistenceError when query returns null data", async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      await expect(repository.getRulesForCardType("test-card")).rejects.toThrow(
        PersistenceError
      );
    });

    it("should throw PersistenceError when update affects no rows", async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const rule: RewardRule = {
        id: "non-existent-id",
        cardTypeId: "test-card",
        name: "Test Rule",
        description: "Test",
        enabled: true,
        priority: 1,
        conditions: [],
        reward: createValidRewardConfig(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await expect(repository.updateRule(rule)).rejects.toThrow(
        PersistenceError
      );
    });

    it("should include operation name in PersistenceError", async () => {
      const dbError = new Error("Database error");
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: dbError,
        }),
      });

      try {
        await repository.getRulesForCardType("test-card");
        fail("Should have thrown PersistenceError");
      } catch (error) {
        expect(error).toBeInstanceOf(PersistenceError);
        expect((error as PersistenceError).operation).toBe(
          "getRulesForCardType"
        );
      }
    });

    it("should include cause in PersistenceError", async () => {
      const dbError = new Error("Database error");
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: dbError,
        }),
      });

      try {
        await repository.getRulesForCardType("test-card");
        fail("Should have thrown PersistenceError");
      } catch (error) {
        expect(error).toBeInstanceOf(PersistenceError);
        expect((error as PersistenceError).cause).toBe(dbError);
      }
    });
  });

  describe("Error message clarity", () => {
    beforeEach(() => {
      mockSupabase = createMockSupabaseClient();
      repository = initializeRuleRepository(mockSupabase);
    });

    it("should provide clear error message for missing name", async () => {
      try {
        await repository.createRule({
          cardTypeId: "test-card",
          name: "",
          description: "Test",
          enabled: true,
          priority: 1,
          conditions: [],
          reward: createValidRewardConfig(),
        });
        fail("Should have thrown ValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain("name");
        expect((error as ValidationError).message).toContain("required");
      }
    });

    it("should provide clear error message for missing cardTypeId", async () => {
      try {
        await repository.createRule({
          cardTypeId: "",
          name: "Test Rule",
          description: "Test",
          enabled: true,
          priority: 1,
          conditions: [],
          reward: createValidRewardConfig(),
        });
        fail("Should have thrown ValidationError");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain("Card type ID");
        expect((error as ValidationError).message).toContain("required");
      }
    });

    it("should provide clear error message for authentication failure", async () => {
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      });

      try {
        await repository.getRulesForCardType("test-card");
        fail("Should have thrown AuthenticationError");
      } catch (error) {
        expect(error).toBeInstanceOf(AuthenticationError);
        expect((error as AuthenticationError).message).toContain(
          "not authenticated"
        );
      }
    });
  });
});
