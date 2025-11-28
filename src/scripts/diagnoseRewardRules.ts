/**
 * Diagnostic script to test reward rules loading
 * Run this to diagnose issues with reward rules
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function diagnoseRewardRules() {
  console.log("=== Reward Rules Diagnostic ===\n");

  // Step 1: Check Supabase connection
  console.log("1. Checking Supabase connection...");
  try {
    const { data, error } = await supabase.from("reward_rules").select("count");
    if (error) {
      console.error("❌ Supabase connection error:", error.message);
      return;
    }
    console.log("✅ Supabase connection successful\n");
  } catch (error) {
    console.error("❌ Supabase connection failed:", error);
    return;
  }

  // Step 2: Check authentication
  console.log("2. Checking authentication...");
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ Authentication error:", error.message);
      return;
    }
    if (!session) {
      console.error("❌ No active session - user not logged in");
      return;
    }
    console.log("✅ User authenticated:", session.user.email);
    console.log("   User ID:", session.user.id, "\n");
  } catch (error) {
    console.error("❌ Authentication check failed:", error);
    return;
  }

  // Step 3: Initialize RuleRepository
  console.log("3. Initializing RuleRepository...");
  try {
    initializeRuleRepository(supabase);
    console.log("✅ RuleRepository initialized\n");
  } catch (error) {
    console.error("❌ RuleRepository initialization failed:", error);
    return;
  }

  // Step 4: Test getRuleRepository
  console.log("4. Getting RuleRepository instance...");
  try {
    const repository = getRuleRepository();
    console.log("✅ RuleRepository instance obtained\n");

    // Step 5: Verify connection
    console.log("5. Verifying database connection...");
    const connResult = await repository.verifyConnection();
    if (!connResult.isConnected) {
      console.error("❌ Database connection failed:", connResult.error);
      return;
    }
    console.log(
      "✅ Database connected (latency:",
      connResult.latencyMs,
      "ms)\n"
    );

    // Step 6: Verify authentication
    console.log("6. Verifying authentication through repository...");
    const authResult = await repository.verifyAuthentication();
    if (!authResult.isAuthenticated) {
      console.error("❌ Authentication failed:", authResult.error);
      return;
    }
    console.log("✅ Authentication verified\n");

    // Step 7: Test loading rules for a sample card
    console.log("7. Testing rule loading...");
    const testCardTypeId = cardTypeIdService.generateCardTypeId(
      "American Express",
      "Cobalt"
    );
    console.log("   Test card type ID:", testCardTypeId);

    try {
      const rules = await repository.getRulesForCardType(testCardTypeId);
      console.log("✅ Rules loaded successfully");
      console.log("   Number of rules:", rules.length);
      if (rules.length > 0) {
        console.log("   First rule:", rules[0].name);
      }
    } catch (error) {
      console.error("❌ Failed to load rules:", error);
      if (error instanceof Error) {
        console.error("   Error message:", error.message);
        console.error("   Error name:", error.name);
      }
    }
  } catch (error) {
    console.error("❌ Failed to get repository:", error);
    return;
  }

  console.log("\n=== Diagnostic Complete ===");
}

// Run the diagnostic
diagnoseRewardRules().catch(console.error);
