/**
 * Utility script to verify Supabase connection and authentication
 *
 * This script can be used to diagnose connection issues with Supabase.
 * Run it to check:
 * - Supabase client initialization
 * - User authentication status
 * - Database connectivity
 */

import { initializeRuleRepository } from "../core/rewards/RuleRepository";
import { supabase } from "../integrations/supabase/client";

async function verifySupabaseConnection() {
  console.log("=== Supabase Connection Verification ===\n");

  try {
    // Initialize the repository
    const repository = initializeRuleRepository(supabase);
    console.log("✓ RuleRepository initialized\n");

    // Check client initialization
    console.log("1. Checking Supabase client initialization...");
    const isInitialized = repository.isSupabaseClientInitialized();
    console.log(`   Client initialized: ${isInitialized ? "✓ YES" : "✗ NO"}\n`);

    // Check authentication
    console.log("2. Checking authentication status...");
    const authStatus = await repository.verifyAuthentication();
    console.log(
      `   Authenticated: ${authStatus.isAuthenticated ? "✓ YES" : "✗ NO"}`
    );
    if (authStatus.isAuthenticated) {
      console.log(`   User ID: ${authStatus.userId}`);
    } else if (authStatus.error) {
      console.log(`   Error: ${authStatus.error}`);
    }
    console.log();

    // Check database connection
    console.log("3. Testing database connection...");
    const connectionStatus = await repository.verifyConnection();
    console.log(
      `   Connected: ${connectionStatus.isConnected ? "✓ YES" : "✗ NO"}`
    );
    console.log(`   Latency: ${connectionStatus.latencyMs}ms`);
    if (connectionStatus.error) {
      console.log(`   Error: ${connectionStatus.error}`);
    }
    console.log();

    // Summary
    console.log("=== Summary ===");
    const allGood = isInitialized && connectionStatus.isConnected;
    if (allGood) {
      console.log("✓ All checks passed!");
      if (!authStatus.isAuthenticated) {
        console.log(
          "⚠ Note: User is not authenticated. This is normal if not logged in."
        );
      }
    } else {
      console.log("✗ Some checks failed. Please review the errors above.");
    }
  } catch (error) {
    console.error("✗ Fatal error during verification:", error);
    process.exit(1);
  }
}

// Run the verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  verifySupabaseConnection();
}

export { verifySupabaseConnection };
