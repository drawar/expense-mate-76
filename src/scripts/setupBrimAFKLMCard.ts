/**
 * Script to set up accurate reward rules for Brim Financial Air France KLM World Elite Mastercard
 *
 * Rules:
 * 1a. 6x on Air France/KLM EUR flights (MCC 3007/3010) - 5 bonus per EUR + 1 base
 * 1b. 6x on Air France/KLM EUR flights (merchant match) - 5 bonus per EUR + 1 base
 * 1c. ~4.09x on Air France/KLM CAD flights (MCC) - 5/1.62 bonus per CAD + 1 base
 * 1d. ~4.09x on Air France/KLM CAD flights (merchant) - 5/1.62 bonus per CAD + 1 base
 * 2. 2x on restaurants (MCC 5812/5814) - 1 base + 1 bonus
 * 3. 1x on everything else
 *
 * Note: Bonus is 5 miles per EUR spent. For CAD transactions, we convert using EUR/CAD = 1.62
 * Points Currency: Flying Blue Miles
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function setupBrimAFKLMCard() {
  console.log(
    "=== Setting Up Brim Financial Air France KLM World Elite Mastercard ===\n"
  );

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
    "Brim Financial",
    "Air France KLM World Elite"
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

  try {
    // Air France (MCC 3007) and KLM (MCC 3010)
    const afklmMCCs = ["3007", "3010"];

    // Air France/KLM merchant name variations
    const afklmMerchants = [
      "Air France",
      "AIR FRANCE",
      "AIRFRANCE",
      "KLM",
      "KLM AIRLINE",
      "KLM ROYAL DUTCH",
      "FLYING BLUE",
    ];

    // Restaurant MCCs (5812 = Eating Places/Restaurants, 5814 = Fast Food)
    const restaurantMCCs = ["5812", "5814"];

    // EUR/CAD conversion rate for bonus calculation
    // Bonus is 5 miles per EUR, so for CAD: 5 / 1.62 = 3.086 bonus per CAD
    const eurCadRate = 1.62;
    const cadBonusMultiplier = 5 / eurCadRate; // ~3.086

    // Rule 1a: 6x on Air France/KLM EUR Flights (MCC match)
    console.log(
      "Creating Rule 1a: 6x on Air France/KLM EUR Flights (MCC match)..."
    );
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "6x Flying Blue Miles on Air France/KLM (EUR)",
      description:
        "Earn 6 Flying Blue Miles per €1 on Air France and KLM flights in EUR (5 bonus + 1 base)",
      enabled: true,
      priority: 6,
      conditions: [
        { type: "mcc", operation: "include", values: afklmMCCs },
        { type: "currency", operation: "equals", values: ["EUR"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 5, // 5 bonus + 1 base = 6x total
        pointsCurrency: "Flying Blue Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1a created (EUR, MCC 3007/3010)\n");

    // Rule 1b: 6x on Air France/KLM EUR Flights (Merchant name match)
    console.log(
      "Creating Rule 1b: 6x on Air France/KLM EUR Flights (Merchant match)..."
    );
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "6x Flying Blue Miles on Air France/KLM (EUR, Merchant)",
      description:
        "Earn 6 Flying Blue Miles per €1 on Air France and KLM flights in EUR (matched by merchant)",
      enabled: true,
      priority: 5,
      conditions: [
        { type: "merchant", operation: "include", values: afklmMerchants },
        { type: "currency", operation: "equals", values: ["EUR"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 5, // 5 bonus + 1 base = 6x total
        pointsCurrency: "Flying Blue Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1b created (EUR, merchant match)\n");

    // Rule 1c: ~4.09x on Air France/KLM CAD Flights (MCC match)
    console.log(
      "Creating Rule 1c: ~4.09x on Air France/KLM CAD Flights (MCC match)..."
    );
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "~4.09x Flying Blue Miles on Air France/KLM (CAD)",
      description: `Earn ~4.09 Flying Blue Miles per $1 CAD on Air France and KLM flights (5 bonus/€ ÷ ${eurCadRate} + 1 base)`,
      enabled: true,
      priority: 4,
      conditions: [
        { type: "mcc", operation: "include", values: afklmMCCs },
        { type: "currency", operation: "equals", values: ["CAD"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: cadBonusMultiplier, // ~3.086
        pointsCurrency: "Flying Blue Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log(
      `✅ Rule 1c created (CAD, MCC) - bonus: ${cadBonusMultiplier.toFixed(3)}/CAD\n`
    );

    // Rule 1d: ~4.09x on Air France/KLM CAD Flights (Merchant name match)
    console.log(
      "Creating Rule 1d: ~4.09x on Air France/KLM CAD Flights (Merchant match)..."
    );
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "~4.09x Flying Blue Miles on Air France/KLM (CAD, Merchant)",
      description:
        "Earn ~4.09 Flying Blue Miles per $1 CAD on Air France and KLM flights (matched by merchant)",
      enabled: true,
      priority: 3,
      conditions: [
        { type: "merchant", operation: "include", values: afklmMerchants },
        { type: "currency", operation: "equals", values: ["CAD"] },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: cadBonusMultiplier, // ~3.086
        pointsCurrency: "Flying Blue Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1d created (CAD, merchant match)\n");

    // Rule 2: 2x on Restaurants
    console.log("Creating Rule 2: 2x on Restaurants...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "2x Flying Blue Miles on Restaurants",
      description:
        "Earn 2 Flying Blue Miles per $1 at eating places, restaurants, and fast food (MCC 5812/5814)",
      enabled: true,
      priority: 2,
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: restaurantMCCs,
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1, // 1 bonus + 1 base = 2x total
        pointsCurrency: "Flying Blue Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 2 created\n");

    // Rule 3: 1x on Everything Else (Base earn rate)
    console.log("Creating Rule 3: 1x on All Other Purchases...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "1x Flying Blue Miles on All Other Purchases",
      description:
        "Earn 1 Flying Blue Mile per $1 on all other eligible purchases",
      enabled: true,
      priority: 1,
      conditions: [],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0,
        pointsCurrency: "Flying Blue Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 3 created\n");

    console.log("=== Setup Complete ===\n");
    console.log(
      "✅ All rules created successfully for Brim Air France KLM World Elite Mastercard\n"
    );
    console.log("Summary:");
    console.log(
      "- Priority 6: 6x on Air France/KLM EUR flights (MCC 3007/3010)"
    );
    console.log(
      "- Priority 5: 6x on Air France/KLM EUR flights (merchant match)"
    );
    console.log(
      "- Priority 4: ~4.09x on Air France/KLM CAD flights (MCC) - 5 bonus/€ ÷ 1.62 + 1 base"
    );
    console.log(
      "- Priority 3: ~4.09x on Air France/KLM CAD flights (merchant match)"
    );
    console.log("- Priority 2: 2x on restaurants (MCC 5812/5814)");
    console.log("- Priority 1: 1x on everything else");
    console.log("\nNotes:");
    console.log("1. Bonus is 5 miles per EUR spent on AF/KLM flights");
    console.log(
      "2. For CAD transactions, bonus is converted: 5 ÷ 1.62 = 3.086 miles per CAD"
    );
    console.log("3. No monthly spending caps on any category");
    console.log("4. Points currency: Flying Blue Miles");
  } catch (error) {
    console.error("❌ Failed to create rules:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
  }
}

// Run the setup
setupBrimAFKLMCard().catch(console.error);
