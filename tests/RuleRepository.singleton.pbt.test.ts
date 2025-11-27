import { describe, it, expect, beforeEach } from "@jest/globals";
import fc from "fast-check";
import {
  RuleRepository,
  initializeRuleRepository,
} from "../src/core/rewards/RuleRepository";
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

describe("RuleRepository Singleton Property Tests", () => {
  beforeEach(() => {
    // Reset singleton before each test
    RuleRepository["resetInstance"]();
  });

  it("**Feature: codebase-improvements, Property 5: Repository singleton consistency**", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a random number of access attempts (between 2 and 20)
        fc.integer({ min: 2, max: 20 }),
        async (accessCount) => {
          // Initialize the repository once
          const supabase = createMockSupabaseClient([mockRule]);
          const firstInstance = initializeRuleRepository(supabase);

          // Access the repository multiple times
          const instances: RuleRepository[] = [];
          for (let i = 0; i < accessCount; i++) {
            instances.push(RuleRepository.getInstance());
          }

          // All instances should be the same reference
          for (const instance of instances) {
            expect(instance).toBe(firstInstance);
          }

          // Verify they all share the same internal state
          const allInitialized = instances.every((inst) =>
            inst.isSupabaseClientInitialized()
          );
          expect(allInitialized).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should throw error when accessing uninitialized repository", () => {
    // Reset to ensure clean state
    RuleRepository["resetInstance"]();

    // Attempting to get instance without initialization should throw
    expect(() => RuleRepository.getInstance()).toThrow(
      "RuleRepository has not been initialized"
    );
  });

  it("should maintain singleton across different access patterns", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.boolean(), { minLength: 5, maxLength: 15 }),
        async (accessPattern) => {
          // Initialize once
          const supabase = createMockSupabaseClient([mockRule]);
          const initialInstance = initializeRuleRepository(supabase);

          // Access using different methods based on pattern
          const instances: RuleRepository[] = [initialInstance];

          for (const useGetInstance of accessPattern) {
            if (useGetInstance) {
              instances.push(RuleRepository.getInstance());
            } else {
              // Try to initialize again (should return same instance)
              instances.push(initializeRuleRepository(supabase));
            }
          }

          // All should be the same instance
          const allSame = instances.every((inst) => inst === initialInstance);
          expect(allSame).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
