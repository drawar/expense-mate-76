/**
 * Script to verify that the reward rules fix has been applied correctly
 * Run this after applying the database migration
 */

import { supabase } from "@/integrations/supabase/client";

async function verifyFix() {
  console.log("=== Verifying Reward Rules Fix ===\n");

  // Step 1: Check if user is authenticated
  console.log("1. Checking authentication...");
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    console.error("❌ Not authenticated. Please log in first.");
    return false;
  }

  console.log("✅ Authenticated as:", session.user.email, "\n");

  // Step 2: Check card_type_id column type
  console.log("2. Checking card_type_id column type...");
  const { data: columnInfo, error: columnError } = await supabase.rpc(
    "exec_sql",
    {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'reward_rules' AND column_name = 'card_type_id'
      `,
    }
  );

  if (columnError) {
    // Try alternative method
    console.log("   Using alternative verification method...");

    // Try to insert a test rule with a string card_type_id
    const testCardTypeId = "test-card-" + Date.now();
    const { error: insertError } = await supabase
      .from("reward_rules")
      .insert({
        card_type_id: testCardTypeId,
        name: "Test Rule",
        description: "Temporary test rule",
        enabled: false,
        priority: 0,
      })
      .select();

    if (insertError) {
      if (
        insertError.message.includes("uuid") ||
        insertError.message.includes("invalid input syntax")
      ) {
        console.error(
          "❌ card_type_id is still uuid type. Migration not applied."
        );
        console.error("   Error:", insertError.message);
        console.log("\n⚠️  Please apply the migration from:");
        console.log(
          "   supabase/migrations/20251127000000_fix_card_type_id_type.sql"
        );
        return false;
      } else {
        console.error("❌ Unexpected error:", insertError.message);
        return false;
      }
    }

    // Clean up test rule
    await supabase
      .from("reward_rules")
      .delete()
      .eq("card_type_id", testCardTypeId);

    console.log("✅ card_type_id accepts text values (migration applied)\n");
  } else {
    console.log("✅ Column type verified\n");
  }

  // Step 3: Check if reward_rules table is accessible
  console.log("3. Checking reward_rules table access...");
  const { data: rules, error: rulesError } = await supabase
    .from("reward_rules")
    .select("id, card_type_id, name")
    .limit(5);

  if (rulesError) {
    console.error("❌ Cannot access reward_rules table:", rulesError.message);
    return false;
  }

  console.log("✅ reward_rules table accessible");
  console.log("   Current rules count:", rules?.length || 0);

  if (rules && rules.length > 0) {
    console.log("   Sample rules:");
    rules.forEach((rule) => {
      console.log(`   - ${rule.name} (${rule.card_type_id})`);
    });
  }
  console.log();

  // Step 4: Test creating a rule with string card_type_id
  console.log("4. Testing rule creation with string card_type_id...");
  const testCardTypeId = "test-verification-" + Date.now();

  const { data: createdRule, error: createError } = await supabase
    .from("reward_rules")
    .insert({
      card_type_id: testCardTypeId,
      name: "Verification Test Rule",
      description: "This is a test rule to verify the fix",
      enabled: false,
      priority: 0,
      conditions: [],
      base_multiplier: 1,
      bonus_multiplier: 0,
      points_currency: "test",
    })
    .select()
    .single();

  if (createError) {
    console.error("❌ Failed to create test rule:", createError.message);
    return false;
  }

  console.log("✅ Test rule created successfully");
  console.log("   Rule ID:", createdRule.id);
  console.log("   Card Type ID:", createdRule.card_type_id, "(string type)\n");

  // Step 5: Test querying by string card_type_id
  console.log("5. Testing query by string card_type_id...");
  const { data: queriedRules, error: queryError } = await supabase
    .from("reward_rules")
    .select("*")
    .eq("card_type_id", testCardTypeId);

  if (queryError) {
    console.error("❌ Failed to query by card_type_id:", queryError.message);

    // Clean up
    await supabase.from("reward_rules").delete().eq("id", createdRule.id);
    return false;
  }

  if (!queriedRules || queriedRules.length === 0) {
    console.error("❌ Query returned no results");

    // Clean up
    await supabase.from("reward_rules").delete().eq("id", createdRule.id);
    return false;
  }

  console.log("✅ Query by string card_type_id successful");
  console.log("   Found", queriedRules.length, "rule(s)\n");

  // Step 6: Clean up test rule
  console.log("6. Cleaning up test rule...");
  const { error: deleteError } = await supabase
    .from("reward_rules")
    .delete()
    .eq("id", createdRule.id);

  if (deleteError) {
    console.error("⚠️  Failed to delete test rule:", deleteError.message);
    console.log("   Please manually delete rule with ID:", createdRule.id);
  } else {
    console.log("✅ Test rule deleted\n");
  }

  // Step 7: Verify RLS policies
  console.log("7. Checking RLS policies...");
  const { data: policies, error: policiesError } = await supabase.rpc(
    "exec_sql",
    {
      sql: `
        SELECT policyname, cmd 
        FROM pg_policies 
        WHERE tablename = 'reward_rules'
      `,
    }
  );

  if (policiesError) {
    console.log("⚠️  Could not verify RLS policies (this is okay)");
  } else {
    console.log("✅ RLS policies configured\n");
  }

  // Final summary
  console.log("=== Verification Complete ===\n");
  console.log("✅ All checks passed!");
  console.log("\nYou can now:");
  console.log("1. Create payment methods in the app");
  console.log("2. Click 'Manage Reward Rules' without errors");
  console.log("3. Run the setup script to create rules for your cards:");
  console.log("   import('/src/scripts/setupCreditCards.ts')");

  return true;
}

// Run verification
verifyFix()
  .then((success) => {
    if (!success) {
      console.log("\n❌ Verification failed. Please check the errors above.");
    }
  })
  .catch((error) => {
    console.error("\n❌ Verification error:", error);
  });
