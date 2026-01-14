/**
 * Script to set up reward rules for OCBC Rewards World Mastercard (Singapore)
 *
 * Rules:
 * - Tier 1: 15x on department stores (MCC 5311) and Watsons
 * - Tier 2: 10x on shopping & dining MCCs
 * - Base: 1x on everything else
 *
 * Calculation: Floor to nearest $5, then multiply
 * - Base: 5 OCBC$ per $5 block
 * - Tier 1 bonus: 70 OCBC$ per $5 block (total 75 = 15x)
 * - Tier 2 bonus: 45 OCBC$ per $5 block (total 50 = 10x)
 *
 * Cap: 10,000 bonus OCBC$ per calendar month
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function setupOCBCRewardsWorldCard() {
  console.log("=== Setting Up OCBC Rewards World Mastercard (Singapore) ===\n");

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

  // Generate card type ID
  const cardTypeId = cardTypeIdService.generateCardTypeId(
    "OCBC",
    "Rewards World Mastercard"
  );
  console.log("Card Type ID:", cardTypeId, "\n");

  // Delete existing rules for this card
  console.log("Cleaning up existing rules...");
  const { data: existingRules } = await supabase
    .from("reward_rules")
    .select("id")
    .eq("card_type_id", cardTypeId);

  if (existingRules && existingRules.length > 0) {
    for (const rule of existingRules) {
      await repository.deleteRule(rule.id);
    }
    console.log("✅ Deleted", existingRules.length, "existing rule(s)\n");
  }

  // Shared cap group ID for the 10,000 bonus points monthly cap
  const sharedCapGroupId = "ocbc-rewards-world-bonus-cap";

  try {
    // ==========================================
    // Tier 1 MCCs - Department Stores
    // ==========================================
    const tier1MCCs = ["5311"]; // Department Stores

    // ==========================================
    // Tier 2 MCCs - Shopping & Dining
    // ==========================================
    const tier2MCCs = [
      "5309", // Duty Free Stores
      "5611", // Men's and Boys' Clothing
      "5621", // Women's Ready to Wear
      "5641", // Children's and Infants' Wear
      "5651", // Family Clothing Stores
      "5655", // Sports Apparel
      "5661", // Shoe Stores
      "5691", // Men's and Women's Clothing
      "5699", // Accessory and Apparel Stores
      "5941", // Sporting Goods Stores
      "5948", // Leather Goods and Luggage
    ];

    // ==========================================
    // RULE 1: 15x on Tier 1 (Department Stores & Watsons)
    // ==========================================
    console.log("Creating Rule 1: 15x on Department Stores & Watsons...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "15x Points on Department Stores & Watsons",
      description:
        "Earn 15x OCBC$ (75 per $5) on department stores (MCC 5311) and Watsons",
      enabled: true,
      priority: 3, // Highest priority
      conditions: [
        {
          type: "compound",
          operation: "any",
          values: [],
          subConditions: [
            {
              type: "mcc",
              operation: "include",
              values: tier1MCCs,
            },
            {
              type: "merchant",
              operation: "include",
              values: ["Watsons"],
            },
          ],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 5,
        bonusMultiplier: 70, // 70 bonus + 5 base = 75 per $5 = 15x
        pointsCurrency: "OCBC$",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "floor5",
        blockSize: 5,
        monthlyCap: 10000, // 10,000 bonus points cap
        monthlyCapType: "bonus_points",
        monthlySpendPeriodType: "calendar",
        capGroupId: sharedCapGroupId,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1 created\n");

    // ==========================================
    // RULE 2: 10x on Tier 2 (Shopping & Dining MCCs)
    // ==========================================
    console.log("Creating Rule 2: 10x on Shopping & Dining...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "10x Points on Shopping & Dining",
      description:
        "Earn 10x OCBC$ (50 per $5) on shopping and dining categories",
      enabled: true,
      priority: 2, // Second priority
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: tier2MCCs,
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 5,
        bonusMultiplier: 45, // 45 bonus + 5 base = 50 per $5 = 10x
        pointsCurrency: "OCBC$",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "floor5",
        blockSize: 5,
        monthlyCap: 10000, // 10,000 bonus points cap
        monthlyCapType: "bonus_points",
        monthlySpendPeriodType: "calendar",
        capGroupId: sharedCapGroupId,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 2 created\n");

    // ==========================================
    // RULE 3: 1x on Everything Else (Base Rate)
    // ==========================================
    console.log("Creating Rule 3: 1x on All Other Purchases (Base Rate)...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "1x Points on All Other Purchases",
      description: "Earn 1x OCBC$ (5 per $5) on all other eligible purchases",
      enabled: true,
      priority: 1, // Lowest priority - catch-all rule
      conditions: [], // No conditions - matches everything
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 5,
        bonusMultiplier: 0, // No bonus, just base
        pointsCurrency: "OCBC$",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "floor5",
        blockSize: 5,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 3 created\n");

    console.log("=== Setup Complete ===\n");
    console.log(
      "✅ All rules created successfully for OCBC Rewards World Mastercard\n"
    );
    console.log("Summary:");
    console.log("- Priority 3: 15x on Department Stores & Watsons");
    console.log("- Priority 2: 10x on Shopping & Dining");
    console.log("- Priority 1: 1x on everything else");
    console.log("\nImportant Notes:");
    console.log("1. Monthly bonus cap: 10,000 OCBC$ per calendar month");
    console.log("   - Shared between Tier 1 and Tier 2 transactions");
    console.log("   - Cap resets on the 1st of each calendar month");
    console.log("2. Calculation: Floor to nearest $5, then multiply");
    console.log("   - Example: $64.68 → $60 eligible → 12 blocks");
  } catch (error) {
    console.error("❌ Failed to create rules:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
  }
}

// Make available globally for browser console execution
if (typeof window !== "undefined") {
  (
    window as Window & {
      setupOCBCRewardsWorldCard?: typeof setupOCBCRewardsWorldCard;
    }
  ).setupOCBCRewardsWorldCard = setupOCBCRewardsWorldCard;
}

export { setupOCBCRewardsWorldCard };
export default setupOCBCRewardsWorldCard;
