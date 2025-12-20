/**
 * Script to set up accurate reward rules for Neo Financial Cathay World Elite Mastercard
 *
 * Rules:
 * 1. 4x on Cathay Pacific flights (MCC 3099 or merchant match)
 * 2. 2x on foreign currency transactions (non-CAD)
 * 3. 1x on everything else
 *
 * Important: Amount is rounded up (ceiling) before multiplying by the multiplier.
 * Example: CAD 14.47 foreign currency → 15 × 2 = 30 Asia Miles
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function setupNeoCathayCard() {
  console.log(
    "=== Setting Up Neo Financial Cathay World Elite Mastercard ===\n"
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
    "Neo Financial",
    "Cathay World Elite"
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
    // Cathay Pacific MCC code
    const cathayPacificMCC = "3099";

    // Cathay Pacific merchant name variations (excluding "CX" as per user request)
    const cathayPacificMerchants = [
      "Cathay Pacific",
      "CATHAY PACIFIC",
      "CATHAYPACIFIC",
      "CATHAYPACAIR",
    ];

    // Rule 1: 4x on Cathay Pacific Flights (MCC match)
    // Highest priority
    console.log(
      "Creating Rule 1a: 4x on Cathay Pacific Flights (MCC match)..."
    );
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "4x Asia Miles on Cathay Pacific (MCC)",
      description:
        "Earn 4 Asia Miles per $1 on Cathay Pacific flights (matched by MCC 3099)",
      enabled: true,
      priority: 4, // Highest priority
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: [cathayPacificMCC],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 3, // 3 bonus + 1 base = 4x total
        pointsCurrency: "Asia Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "ceiling",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1a created (MCC 3099)\n");

    // Rule 1b: 4x on Cathay Pacific Flights (Merchant name match)
    console.log(
      "Creating Rule 1b: 4x on Cathay Pacific Flights (Merchant match)..."
    );
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "4x Asia Miles on Cathay Pacific (Merchant)",
      description:
        "Earn 4 Asia Miles per $1 on Cathay Pacific flights (matched by merchant name)",
      enabled: true,
      priority: 3, // Slightly lower than MCC match
      conditions: [
        {
          type: "merchant",
          operation: "include",
          values: cathayPacificMerchants,
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 3, // 3 bonus + 1 base = 4x total
        pointsCurrency: "Asia Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "ceiling",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1b created (merchant name match)\n");

    // Rule 2: 2x on Foreign Currency Transactions
    console.log("Creating Rule 2: 2x on Foreign Currency Transactions...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "2x Asia Miles on Foreign Currency",
      description:
        "Earn 2 Asia Miles per $1 on transactions in foreign currencies (non-CAD)",
      enabled: true,
      priority: 2,
      conditions: [
        {
          type: "currency",
          operation: "exclude",
          values: ["CAD"],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1, // 1 bonus + 1 base = 2x total
        pointsCurrency: "Asia Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "ceiling",
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
      name: "1x Asia Miles on All Other Purchases",
      description: "Earn 1 Asia Mile per $1 on all other eligible purchases",
      enabled: true,
      priority: 1, // Lowest priority - catch-all rule
      conditions: [], // No conditions - matches everything
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0, // No bonus, just base
        pointsCurrency: "Asia Miles",
        pointsRoundingStrategy: "floor",
        amountRoundingStrategy: "ceiling",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 3 created\n");

    console.log("=== Setup Complete ===\n");
    console.log(
      "✅ All rules created successfully for Neo Financial Cathay World Elite Mastercard\n"
    );
    console.log("Summary:");
    console.log("- Priority 4: 4x on Cathay Pacific flights (MCC 3099)");
    console.log(
      "- Priority 3: 4x on Cathay Pacific flights (merchant name match)"
    );
    console.log("- Priority 2: 2x on foreign currency transactions (non-CAD)");
    console.log("- Priority 1: 1x on everything else");
    console.log("\nImportant Notes:");
    console.log("1. Amount is rounded UP (ceiling) before multiplying");
    console.log(
      "   - Example: CAD 14.47 foreign purchase → ceil(14.47) × 2 = 30 Asia Miles"
    );
    console.log("2. No monthly spending caps on any category");
    console.log("3. Points currency: Asia Miles");
  } catch (error) {
    console.error("❌ Failed to create rules:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
  }
}

// Run the setup
setupNeoCathayCard().catch(console.error);
