/**
 * Script to set up accurate reward rules for American Express Aeroplan Reserve Card (Canada)
 *
 * Rules:
 * 1. 3x on Air Canada direct purchases (merchant match)
 * 2. 2x on dining, coffee shops, bars, and food delivery (CAD only)
 * 3. 1.25x on everything else
 *
 * Important:
 * - 2x bonus only applies to CAD transactions
 * - No monthly caps on any category
 * - Points round to nearest integer (12.5 → 13)
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function setupAmexAeroplanReserveCard() {
  console.log(
    "=== Setting Up American Express Aeroplan Reserve Card (Canada) ===\n"
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
    "American Express",
    "Aeroplan Reserve"
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
    // MCCs for restaurants, quick service restaurants, coffee shops, and drinking establishments
    const diningMCCs = [
      "5811", // Caterers
      "5812", // Eating Places, Restaurants
      "5813", // Drinking Places (Bars, Taverns, Nightclubs)
      "5814", // Fast Food Restaurants
    ];

    // MCCs for food delivery services
    // Note: Many food delivery services (Uber Eats, DoorDash, Skip the Dishes)
    // code as 5812 or 5814, but some may use 5499
    const foodDeliveryMCCs = [
      "5499", // Miscellaneous Food Stores - includes some delivery services
    ];

    // Combine all 2x categories
    const twoXMCCs = [...diningMCCs, ...foodDeliveryMCCs];

    // Rule 1: 3x on Air Canada Direct Purchases
    // Highest priority - merchant name match
    console.log("Creating Rule 1: 3x on Air Canada Direct Purchases...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "3x Points on Air Canada",
      description:
        "Earn 3 points per $1 on purchases made directly with Air Canada (including Air Canada Vacations packages purchased directly from Air Canada)",
      enabled: true,
      priority: 3, // Highest priority
      conditions: [
        {
          type: "merchant",
          operation: "include",
          values: ["Air Canada", "AIR CANADA", "AIRCANADA", "AC VACATIONS"],
        },
      ],
      reward: {
        calculationMethod: "total_first", // Amex Canada: total = round(amount * 3), bonus = total - base
        baseMultiplier: 1,
        bonusMultiplier: 2, // 2 bonus + 1 base = 3x total
        pointsCurrency: "Aeroplan",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1 created\n");

    // Rule 2: 2x on Dining & Food Delivery (CAD only)
    console.log("Creating Rule 2: 2x on Dining & Food Delivery (CAD only)...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "2x Points on Dining & Food Delivery",
      description:
        "Earn 2 points per $1 CAD at restaurants, quick service restaurants, coffee shops, drinking establishments, and food delivery services in Canada",
      enabled: true,
      priority: 2,
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: twoXMCCs,
        },
        {
          type: "currency",
          operation: "equals",
          values: ["CAD"],
        },
      ],
      reward: {
        calculationMethod: "total_first", // Amex Canada: total = round(amount * 2), bonus = total - base
        baseMultiplier: 1,
        bonusMultiplier: 1, // 1 bonus + 1 base = 2x total
        pointsCurrency: "Aeroplan",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 2 created\n");

    // Rule 3: 1.25x on Everything Else (Base earn rate - all currencies)
    console.log("Creating Rule 3: 1.25x on All Other Purchases...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "1.25x Points on All Other Purchases",
      description:
        "Earn 1.25 points per $1 on all other eligible purchases (includes foreign currency transactions and non-bonus categories)",
      enabled: true,
      priority: 1, // Lowest priority - catch-all rule
      conditions: [], // No conditions - matches everything
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1.25,
        bonusMultiplier: 0, // No bonus, just 1.25 base
        pointsCurrency: "Aeroplan",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 3 created\n");

    console.log("=== Setup Complete ===\n");
    console.log(
      "✅ All rules created successfully for American Express Aeroplan Reserve Card\n"
    );
    console.log("Summary:");
    console.log(
      "- Priority 3: 3x on Air Canada direct purchases (merchant match)"
    );
    console.log("- Priority 2: 2x on dining & food delivery (CAD only)");
    console.log("- Priority 1: 1.25x on everything else (all currencies)");
    console.log("\nImportant Notes:");
    console.log("1. No monthly caps on any category");
    console.log("2. 2x bonus ONLY applies to CAD transactions");
    console.log("3. Foreign currency dining earns 1.25x");
    console.log(
      "4. Air Canada purchases must be made directly with Air Canada"
    );
    console.log(
      "   - NOT eligible: tickets from travel agents, third-party websites,"
    );
    console.log(
      "     gift cards, Maple Leaf Club memberships, or hotel/car bookings on aircanada.com"
    );
    console.log(
      "5. Points round to nearest integer (e.g., $10 × 1.25 = 12.5 → 13 points)"
    );
  } catch (error) {
    console.error("❌ Failed to create rules:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
  }
}

// Run the setup
setupAmexAeroplanReserveCard().catch(console.error);
