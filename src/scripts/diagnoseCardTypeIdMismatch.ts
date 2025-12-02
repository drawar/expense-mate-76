/**
 * Diagnostic script to check card_type_id mismatch
 * 
 * This script helps identify why rules aren't being found by comparing:
 * 1. What card_type_id the app is generating
 * 2. What card_type_id values exist in the database
 */

import { supabase } from "@/integrations/supabase/client";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function diagnoseCardTypeIdMismatch() {
  console.log("=== Card Type ID Mismatch Diagnostic ===\n");

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }
  console.log("✅ Authenticated as:", session.user.email, "\n");

  // Generate the card type ID that the app would use
  const generatedCardTypeId = cardTypeIdService.generateCardTypeId(
    "Citibank",
    "Rewards Visa Signature"
  );
  console.log("📝 Generated Card Type ID:", generatedCardTypeId, "\n");

  // Query all rules in the database
  console.log("🔍 Querying all reward rules in database...");
  const { data: allRules, error: allError } = await supabase
    .from("reward_rules")
    .select("id, name, card_type_id");

  if (allError) {
    console.error("❌ Error querying rules:", allError);
    return;
  }

  console.log(`\n📊 Found ${allRules?.length || 0} total rules in database:\n`);
  
  if (allRules && allRules.length > 0) {
    // Group by card_type_id
    const rulesByCardType = allRules.reduce((acc, rule) => {
      const cardTypeId = rule.card_type_id;
      if (!acc[cardTypeId]) {
        acc[cardTypeId] = [];
      }
      acc[cardTypeId].push(rule);
      return acc;
    }, {} as Record<string, typeof allRules>);

    Object.entries(rulesByCardType).forEach(([cardTypeId, rules]) => {
      console.log(`\nCard Type ID: "${cardTypeId}"`);
      console.log(`  Rules (${rules.length}):`);
      rules.forEach(rule => {
        console.log(`    - ${rule.name} (${rule.id})`);
      });
      
      // Check if this matches the generated ID
      if (cardTypeId === generatedCardTypeId) {
        console.log(`  ✅ MATCHES generated ID`);
      } else {
        console.log(`  ❌ DOES NOT MATCH generated ID`);
        console.log(`     Expected: "${generatedCardTypeId}"`);
        console.log(`     Got:      "${cardTypeId}"`);
      }
    });
  } else {
    console.log("  (No rules found in database)");
  }

  // Try querying with the generated card type ID
  console.log(`\n\n🔍 Querying rules with generated card_type_id: "${generatedCardTypeId}"`);
  const { data: matchingRules, error: matchError } = await supabase
    .from("reward_rules")
    .select("*")
    .eq("card_type_id", generatedCardTypeId);

  if (matchError) {
    console.error("❌ Error querying with generated ID:", matchError);
    return;
  }

  console.log(`\n📊 Found ${matchingRules?.length || 0} rules matching generated ID\n`);

  if (matchingRules && matchingRules.length > 0) {
    console.log("✅ Rules found! The card_type_id matches.");
    matchingRules.forEach(rule => {
      console.log(`  - ${rule.name} (Priority: ${rule.priority})`);
    });
  } else {
    console.log("❌ No rules found with generated card_type_id");
    console.log("\n💡 Possible issues:");
    console.log("  1. Rules were created with a different card_type_id format");
    console.log("  2. Rules haven't been created yet");
    console.log("  3. There's a mismatch in issuer/name casing or formatting");
  }

  console.log("\n=== Diagnostic Complete ===");
}

// Run the diagnostic
diagnoseCardTypeIdMismatch().catch(console.error);
