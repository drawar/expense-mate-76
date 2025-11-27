/**
 * Test script for verifying Reward Rule CRUD operations
 *
 * This script can be run to programmatically test the reward rule
 * persistence functionality and verify database operations.
 *
 * Usage:
 * 1. Ensure you're authenticated in the application
 * 2. Run this script from the browser console or as a standalone test
 * 3. Check the console output for test results
 */

import {
  RuleRepository,
  initializeRuleRepository,
} from "@/core/rewards/RuleRepository";
import { RewardRule } from "@/core/rewards/types";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  error?: Error;
}

class RewardRuleCRUDTester {
  private repository: RuleRepository;
  private testResults: TestResult[] = [];
  private testRuleId: string | null = null;
  private testCardTypeId: string = "test-card-" + Date.now();

  constructor() {
    this.repository = initializeRuleRepository(supabase);
  }

  /**
   * Run all CRUD tests
   */
  async runAllTests(): Promise<void> {
    console.log("🧪 Starting Reward Rule CRUD Tests...\n");

    await this.testConnection();
    await this.testAuthentication();
    await this.testCreate();
    await this.testRead();
    await this.testUpdate();
    await this.testDelete();
    await this.testMultipleRules();

    this.printResults();
  }

  /**
   * Test 0: Verify database connection
   */
  private async testConnection(): Promise<void> {
    const testName = "Database Connection";
    console.log(`📡 Testing: ${testName}`);

    try {
      const result = await this.repository.verifyConnection();

      if (result.isConnected) {
        this.addResult(
          testName,
          true,
          `Connected successfully (${result.latencyMs}ms)`
        );
      } else {
        this.addResult(testName, false, `Connection failed: ${result.error}`);
      }
    } catch (error) {
      this.addResult(
        testName,
        false,
        "Connection test threw error",
        error as Error
      );
    }
  }

  /**
   * Test 1: Verify authentication
   */
  private async testAuthentication(): Promise<void> {
    const testName = "User Authentication";
    console.log(`🔐 Testing: ${testName}`);

    try {
      const result = await this.repository.verifyAuthentication();

      if (result.isAuthenticated) {
        this.addResult(
          testName,
          true,
          `Authenticated as user: ${result.userId}`
        );
      } else {
        this.addResult(testName, false, `Not authenticated: ${result.error}`);
      }
    } catch (error) {
      this.addResult(
        testName,
        false,
        "Authentication test threw error",
        error as Error
      );
    }
  }

  /**
   * Test 2: CREATE - Create a new reward rule
   */
  private async testCreate(): Promise<void> {
    const testName = "CREATE Rule";
    console.log(`➕ Testing: ${testName}`);

    try {
      const testRule = {
        cardTypeId: this.testCardTypeId,
        name: "Test Rule - Grocery Bonus",
        description: "Test rule for automated testing",
        enabled: true,
        priority: 1,
        conditions: [
          {
            type: "mcc" as const,
            operation: "include" as const,
            values: ["5411"], // Grocery stores
          },
        ],
        reward: {
          calculationMethod: "standard" as const,
          baseMultiplier: 1,
          bonusMultiplier: 4,
          pointsRoundingStrategy: "nearest" as const,
          amountRoundingStrategy: "floor" as const,
          blockSize: 1,
          bonusTiers: [],
          pointsCurrency: "points",
        },
      };

      const createdRule = await this.repository.createRule(testRule);

      if (createdRule && createdRule.id) {
        this.testRuleId = createdRule.id;
        this.addResult(
          testName,
          true,
          `Rule created with ID: ${createdRule.id}`
        );
      } else {
        this.addResult(testName, false, "Rule created but no ID returned");
      }
    } catch (error) {
      this.addResult(testName, false, "Failed to create rule", error as Error);
    }
  }

  /**
   * Test 3: READ - Retrieve the created rule
   */
  private async testRead(): Promise<void> {
    const testName = "READ Rule";
    console.log(`📖 Testing: ${testName}`);

    if (!this.testRuleId) {
      this.addResult(testName, false, "Skipped: No rule ID from create test");
      return;
    }

    try {
      const rules = await this.repository.getRulesForCardType(
        this.testCardTypeId
      );

      const foundRule = rules.find((r) => r.id === this.testRuleId);

      if (foundRule) {
        const nameMatches = foundRule.name === "Test Rule - Grocery Bonus";
        const priorityMatches = foundRule.priority === 1;
        const conditionsExist = foundRule.conditions.length > 0;

        if (nameMatches && priorityMatches && conditionsExist) {
          this.addResult(
            testName,
            true,
            `Rule retrieved successfully with correct data`
          );
        } else {
          this.addResult(testName, false, "Rule retrieved but data mismatch");
        }
      } else {
        this.addResult(testName, false, "Rule not found in database");
      }
    } catch (error) {
      this.addResult(testName, false, "Failed to read rule", error as Error);
    }
  }

  /**
   * Test 4: UPDATE - Modify the created rule
   */
  private async testUpdate(): Promise<void> {
    const testName = "UPDATE Rule";
    console.log(`✏️ Testing: ${testName}`);

    if (!this.testRuleId) {
      this.addResult(testName, false, "Skipped: No rule ID from create test");
      return;
    }

    try {
      // First, get the current rule
      const rules = await this.repository.getRulesForCardType(
        this.testCardTypeId
      );
      const ruleToUpdate = rules.find((r) => r.id === this.testRuleId);

      if (!ruleToUpdate) {
        this.addResult(testName, false, "Rule not found for update");
        return;
      }

      // Update the rule
      const updatedRule: RewardRule = {
        ...ruleToUpdate,
        name: "Test Rule - Updated Name",
        priority: 2,
        description: "Updated description for testing",
      };

      await this.repository.updateRule(updatedRule);

      // Verify the update
      const rulesAfterUpdate = await this.repository.getRulesForCardType(
        this.testCardTypeId
      );
      const verifyRule = rulesAfterUpdate.find((r) => r.id === this.testRuleId);

      if (verifyRule) {
        const nameUpdated = verifyRule.name === "Test Rule - Updated Name";
        const priorityUpdated = verifyRule.priority === 2;

        if (nameUpdated && priorityUpdated) {
          this.addResult(testName, true, "Rule updated successfully");
        } else {
          this.addResult(
            testName,
            false,
            "Rule updated but changes not persisted"
          );
        }
      } else {
        this.addResult(testName, false, "Rule not found after update");
      }
    } catch (error) {
      this.addResult(testName, false, "Failed to update rule", error as Error);
    }
  }

  /**
   * Test 5: DELETE - Remove the created rule
   */
  private async testDelete(): Promise<void> {
    const testName = "DELETE Rule";
    console.log(`🗑️ Testing: ${testName}`);

    if (!this.testRuleId) {
      this.addResult(testName, false, "Skipped: No rule ID from create test");
      return;
    }

    try {
      await this.repository.deleteRule(this.testRuleId);

      // Verify deletion
      const rulesAfterDelete = await this.repository.getRulesForCardType(
        this.testCardTypeId
      );
      const deletedRule = rulesAfterDelete.find(
        (r) => r.id === this.testRuleId
      );

      if (!deletedRule) {
        this.addResult(testName, true, "Rule deleted successfully");
      } else {
        this.addResult(testName, false, "Rule still exists after deletion");
      }
    } catch (error) {
      this.addResult(testName, false, "Failed to delete rule", error as Error);
    }
  }

  /**
   * Test 6: Multiple rules - Create, read, and delete multiple rules
   */
  private async testMultipleRules(): Promise<void> {
    const testName = "Multiple Rules Management";
    console.log(`📚 Testing: ${testName}`);

    const ruleIds: string[] = [];

    try {
      // Create 3 rules
      for (let i = 1; i <= 3; i++) {
        const rule = await this.repository.createRule({
          cardTypeId: this.testCardTypeId,
          name: `Test Rule ${i}`,
          description: `Test rule ${i} for multiple rules test`,
          enabled: true,
          priority: i,
          conditions: [],
          reward: {
            calculationMethod: "standard" as const,
            baseMultiplier: 1,
            bonusMultiplier: i,
            pointsRoundingStrategy: "nearest" as const,
            amountRoundingStrategy: "floor" as const,
            blockSize: 1,
            bonusTiers: [],
            pointsCurrency: "points",
          },
        });
        ruleIds.push(rule.id);
      }

      // Verify all 3 rules exist
      const allRules = await this.repository.getRulesForCardType(
        this.testCardTypeId
      );
      const testRules = allRules.filter((r) => ruleIds.includes(r.id));

      if (testRules.length === 3) {
        // Clean up - delete all test rules
        for (const id of ruleIds) {
          await this.repository.deleteRule(id);
        }

        // Verify cleanup
        const rulesAfterCleanup = await this.repository.getRulesForCardType(
          this.testCardTypeId
        );
        const remainingTestRules = rulesAfterCleanup.filter((r) =>
          ruleIds.includes(r.id)
        );

        if (remainingTestRules.length === 0) {
          this.addResult(
            testName,
            true,
            "Created, read, and deleted 3 rules successfully"
          );
        } else {
          this.addResult(testName, false, "Some rules not deleted properly");
        }
      } else {
        this.addResult(
          testName,
          false,
          `Expected 3 rules, found ${testRules.length}`
        );
        // Cleanup attempt
        for (const id of ruleIds) {
          try {
            await this.repository.deleteRule(id);
          } catch (e) {
            console.error("Cleanup error:", e);
          }
        }
      }
    } catch (error) {
      this.addResult(
        testName,
        false,
        "Failed multiple rules test",
        error as Error
      );
      // Cleanup attempt
      for (const id of ruleIds) {
        try {
          await this.repository.deleteRule(id);
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
    }
  }

  /**
   * Add a test result
   */
  private addResult(
    testName: string,
    passed: boolean,
    message: string,
    error?: Error
  ): void {
    this.testResults.push({ testName, passed, message, error });

    const icon = passed ? "✅" : "❌";
    console.log(`${icon} ${testName}: ${message}`);
    if (error) {
      console.error("Error details:", error);
    }
    console.log("");
  }

  /**
   * Print summary of all test results
   */
  private printResults(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter((r) => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
    );

    if (failedTests > 0) {
      console.log("\n❌ Failed Tests:");
      this.testResults
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`  - ${r.testName}: ${r.message}`);
          if (r.error) {
            console.log(`    Error: ${r.error.message}`);
          }
        });
    }

    console.log("\n" + "=".repeat(60));

    if (passedTests === totalTests) {
      console.log(
        "🎉 All tests passed! Reward rule CRUD operations are working correctly."
      );
    } else {
      console.log("⚠️ Some tests failed. Please review the errors above.");
    }
  }
}

/**
 * Export function to run tests
 */
export async function runRewardRuleCRUDTests(): Promise<void> {
  const tester = new RewardRuleCRUDTester();
  await tester.runAllTests();
}

// If running in browser console, expose globally
if (typeof window !== "undefined") {
  (
    window as Window & { runRewardRuleCRUDTests: typeof runRewardRuleCRUDTests }
  ).runRewardRuleCRUDTests = runRewardRuleCRUDTests;
}
