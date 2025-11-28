/**
 * Diagnostic script to identify why reward rules aren't showing up
 *
 * This script will:
 * 1. List all payment methods and their generated card type IDs
 * 2. List all reward rules and their card type IDs
 * 3. Show which payment methods have matching rules
 * 4. Identify mismatches
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function diagnoseRewardRulesIssue() {
  console.log("=== Diagnosing Reward Rules Issue ===\n");

  // Initialize repository
  try {
    initializeRuleRepository(supabase);
    console.log("✅ RuleRepository initialized\n");
  } catch (error) {
    console.error("❌ Failed to initialize repository:", error);
    return;
  }

  const repository = getRuleRepository();

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    console.error("❌ Not authenticated. Please log in first.");
    return;
  }
  console.log("✅ Authenticated as:", session.user.email, "\n");

  // Step 1: Get all payment methods
  console.log("=== STEP 1: Payment Methods ===\n");
  const { data: paymentMethods, error: pmError } = await supabase
    .from("payment_methods")
    .select("*")
    .order("name");

  if (pmError) {
    console.error("❌ Error fetching payment methods:", pmError);
    return;
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    console.log("⚠️  No payment methods found in database\n");
  } else {
    console.log(`Found ${paymentMethods.length} payment method(s):\n`);

    const paymentMethodsWithCardTypeId = paymentMethods.map((pm) => {
      const cardTypeId = cardTypeIdService.generateCardTypeId(
        pm.issuer,
        pm.name
      );
      return {
        id: pm.id,
        issuer: pm.issuer,
        name: pm.name,
        cardTypeId: cardTypeId,
      };
    });

    paymentMethodsWithCardTypeId.forEach((pm, index) => {
      console.log(`${index + 1}. Payment Method:`);
      console.log(`   ID: ${pm.id}`);
      console.log(`   Issuer: "${pm.issuer}"`);
      console.log(`   Name: "${pm.name}"`);
      console.log(`   Generated Card Type ID: "${pm.cardTypeId}"`);
      console.log();
    });
  }

  // Step 2: Get all reward rules
  console.log("=== STEP 2: Reward Rules ===\n");
  const { data: rewardRules, error: rrError } = await supabase
    .from("reward_rules")
    .select("*")
    .order("card_type_id, priority");

  if (rrError) {
    console.error("❌ Error fetching reward rules:", rrError);
    return;
  }

  if (!rewardRules || rewardRules.length === 0) {
    console.log("⚠️  No reward rules found in database\n");
  } else {
    console.log(`Found ${rewardRules.length} reward rule(s):\n`);

    // Group by card_type_id
    const rulesByCardType = rewardRules.reduce(
      (acc, rule) => {
        if (!acc[rule.card_type_id]) {
          acc[rule.card_type_id] = [];
        }
        acc[rule.card_type_id].push(rule);
        return acc;
      },
      {} as Record<string, typeof rewardRules>
    );

    Object.entries(rulesByCardType).forEach(([cardTypeId, rules]) => {
      console.log(`Card Type ID: "${cardTypeId}"`);
      console.log(`  ${rules.length} rule(s):`);
      rules.forEach((rule, index) => {
        console.log(
          `    ${index + 1}. ${rule.name} (Priority: ${rule.priority}, Enabled: ${rule.enabled})`
        );
      });
      console.log();
    });
  }

  // Step 3: Match payment methods to rules
  console.log("=== STEP 3: Matching Analysis ===\n");

  if (!paymentMethods || !rewardRules) {
    console.log("⚠️  Cannot perform matching analysis - missing data\n");
    return;
  }

  const paymentMethodsWithCardTypeId = paymentMethods.map((pm) => ({
    id: pm.id,
    issuer: pm.issuer,
    name: pm.name,
    cardTypeId: cardTypeIdService.generateCardTypeId(pm.issuer, pm.name),
  }));

  const ruleCardTypeIds = new Set(rewardRules.map((r) => r.card_type_id));

  console.log("Payment Methods with Matching Rules:\n");
  let matchCount = 0;
  let mismatchCount = 0;

  paymentMethodsWithCardTypeId.forEach((pm) => {
    const hasRules = ruleCardTypeIds.has(pm.cardTypeId);

    if (hasRules) {
      const matchingRules = rewardRules.filter(
        (r) => r.card_type_id === pm.cardTypeId
      );
      console.log(`✅ ${pm.issuer} ${pm.name}`);
      console.log(`   Card Type ID: "${pm.cardTypeId}"`);
      console.log(`   ${matchingRules.length} matching rule(s) found`);
      matchCount++;
    } else {
      console.log(`❌ ${pm.issuer} ${pm.name}`);
      console.log(`   Card Type ID: "${pm.cardTypeId}"`);
      console.log(`   NO MATCHING RULES FOUND`);
      mismatchCount++;
    }
    console.log();
  });

  // Step 4: Identify orphaned rules (rules without matching payment methods)
  console.log("=== STEP 4: Orphaned Rules ===\n");

  const paymentMethodCardTypeIds = new Set(
    paymentMethodsWithCardTypeId.map((pm) => pm.cardTypeId)
  );
  const orphanedRuleCardTypeIds = Array.from(ruleCardTypeIds).filter(
    (cardTypeId) => !paymentMethodCardTypeIds.has(cardTypeId)
  );

  if (orphanedRuleCardTypeIds.length === 0) {
    console.log("✅ No orphaned rules found\n");
  } else {
    console.log(
      `⚠️  Found ${orphanedRuleCardTypeIds.length} card type(s) with rules but no matching payment method:\n`
    );
    orphanedRuleCardTypeIds.forEach((cardTypeId) => {
      const orphanedRules = rewardRules.filter(
        (r) => r.card_type_id === cardTypeId
      );
      console.log(`Card Type ID: "${cardTypeId}"`);
      console.log(`  ${orphanedRules.length} rule(s):`);
      orphanedRules.forEach((rule, index) => {
        console.log(`    ${index + 1}. ${rule.name}`);
      });
      console.log();
    });
  }

  // Summary
  console.log("=== SUMMARY ===\n");
  console.log(`Total Payment Methods: ${paymentMethods.length}`);
  console.log(`  - With matching rules: ${matchCount}`);
  console.log(`  - Without matching rules: ${mismatchCount}`);
  console.log();
  console.log(`Total Reward Rules: ${rewardRules.length}`);
  console.log(`  - Unique card types: ${ruleCardTypeIds.size}`);
  console.log(`  - Orphaned card types: ${orphanedRuleCardTypeIds.length}`);
  console.log();

  if (mismatchCount > 0) {
    console.log("⚠️  ACTION REQUIRED:");
    console.log("Some payment methods don't have matching reward rules.");
    console.log(
      "This is why you're seeing 'No reward rules found for this payment method'."
    );
    console.log();
    console.log("To fix this:");
    console.log("1. Check the issuer and name of your payment methods");
    console.log(
      "2. Run the appropriate setup script (e.g., setupAmexCobaltCard.ts)"
    );
    console.log("3. Make sure the issuer and name match exactly");
    console.log();
    console.log("Example:");
    console.log(
      '  If your payment method has issuer="American Express" and name="Cobalt"'
    );
    console.log(
      '  The generated card type ID will be: "american express-cobalt"'
    );
    console.log("  Your reward rules must have the same card_type_id");
  } else if (orphanedRuleCardTypeIds.length > 0) {
    console.log("⚠️  NOTE:");
    console.log("You have reward rules that don't match any payment methods.");
    console.log(
      "These rules won't be used. Consider deleting them or creating matching payment methods."
    );
  } else {
    console.log("✅ All payment methods have matching reward rules!");
  }
}

// Run the diagnostic
diagnoseRewardRulesIssue().catch(console.error);
