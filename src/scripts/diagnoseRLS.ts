/**
 * Diagnostic script to check Row Level Security (RLS) policies
 * 
 * This checks if RLS is preventing the app from reading reward rules
 */

import { supabase } from "@/integrations/supabase/client";

async function diagnoseRLS() {
  console.log("=== Row Level Security Diagnostic ===\n");

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }
  
  console.log("✅ Authenticated as:", session.user.email);
  console.log("   User ID:", session.user.id, "\n");

  // Try to query reward_rules directly
  console.log("🔍 Test 1: Query ALL reward_rules (no filter)...");
  const { data: allRules, error: allError } = await supabase
    .from("reward_rules")
    .select("id, name, card_type_id, user_id");

  if (allError) {
    console.error("❌ Error querying all rules:", allError);
    console.error("   This suggests an RLS policy is blocking access\n");
  } else {
    console.log(`✅ Success! Found ${allRules?.length || 0} rules`);
    if (allRules && allRules.length > 0) {
      console.log("   Sample rules:");
      allRules.slice(0, 3).forEach(rule => {
        console.log(`     - ${rule.name} (user_id: ${rule.user_id || 'NULL'})`);
      });
    }
    console.log();
  }

  // Try to query with card_type_id filter
  console.log("🔍 Test 2: Query with card_type_id filter...");
  const { data: filteredRules, error: filterError } = await supabase
    .from("reward_rules")
    .select("*")
    .eq("card_type_id", "citibank-rewards-visa-signature");

  if (filterError) {
    console.error("❌ Error querying filtered rules:", filterError);
  } else {
    console.log(`✅ Success! Found ${filteredRules?.length || 0} rules for Citibank`);
    if (filteredRules && filteredRules.length > 0) {
      filteredRules.forEach(rule => {
        console.log(`   - ${rule.name}`);
        console.log(`     user_id: ${rule.user_id || 'NULL'}`);
        console.log(`     enabled: ${rule.enabled}`);
      });
    }
    console.log();
  }

  // Check if rules have user_id set
  console.log("🔍 Test 3: Check user_id on reward_rules...");
  const { data: rulesWithUser, error: userError } = await supabase
    .from("reward_rules")
    .select("id, name, user_id")
    .eq("card_type_id", "citibank-rewards-visa-signature");

  if (userError) {
    console.error("❌ Error:", userError);
  } else if (rulesWithUser && rulesWithUser.length > 0) {
    const hasNullUserId = rulesWithUser.some(r => !r.user_id);
    const hasMatchingUserId = rulesWithUser.some(r => r.user_id === session.user.id);
    
    console.log(`   Rules found: ${rulesWithUser.length}`);
    console.log(`   Rules with NULL user_id: ${rulesWithUser.filter(r => !r.user_id).length}`);
    console.log(`   Rules with YOUR user_id: ${rulesWithUser.filter(r => r.user_id === session.user.id).length}`);
    console.log(`   Rules with OTHER user_id: ${rulesWithUser.filter(r => r.user_id && r.user_id !== session.user.id).length}`);
    
    if (hasNullUserId) {
      console.log("\n⚠️  WARNING: Some rules have NULL user_id");
      console.log("   If RLS requires user_id to match, these rules won't be accessible");
    }
    
    if (!hasMatchingUserId && !hasNullUserId) {
      console.log("\n❌ PROBLEM: Rules belong to a different user!");
      console.log("   The rules were created by a different user account");
      console.log("   You need to either:");
      console.log("   1. Update the rules to have your user_id");
      console.log("   2. Modify the RLS policy to allow access");
      console.log("   3. Re-create the rules while logged in as this user");
    }
  }

  console.log("\n=== Diagnostic Complete ===");
  console.log("\n💡 Next Steps:");
  console.log("If rules exist but aren't accessible:");
  console.log("1. Check the reward_rules table RLS policies in Supabase");
  console.log("2. Ensure rules have the correct user_id");
  console.log("3. Consider updating RLS to allow access to your own rules");
}

// Run the diagnostic
diagnoseRLS().catch(console.error);
