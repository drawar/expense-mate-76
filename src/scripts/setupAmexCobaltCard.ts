/**
 * Script to set up accurate reward rules for American Express Cobalt Card (Canada)
 *
 * Rules:
 * 1. 5x on restaurants, groceries, and food delivery (up to $2,500 CAD monthly spend cap)
 * 2. 3x on streaming subscriptions
 * 3. 2x on gas stations and local transportation
 * 4. 1x on everything else
 *
 * Important: Bonus points only apply to CAD transactions.
 * Foreign currency transactions earn only 1x base points.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function setupAmexCobaltCard() {
  console.log("=== Setting Up American Express Cobalt Card (Canada) ===\n");

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
    "Cobalt"
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
    const restaurantMCCs = [
      "5811", // Caterers
      "5812", // Eating Places, Restaurants
      "5813", // Drinking Places (Bars, Taverns, Nightclubs)
      "5814", // Fast Food Restaurants
    ];

    // MCCs for stand-alone grocery stores
    const groceryMCCs = [
      "5411", // Grocery Stores, Supermarkets
      "5422", // Freezer and Locker Meat Provisioners
      "5441", // Candy, Nut, and Confectionery Stores
      "5451", // Dairy Products Stores
    ];

    // MCCs for food and grocery delivery services
    const deliveryMCCs = [
      "5499", // Miscellaneous Food Stores - Convenience Stores and Specialty Markets (includes delivery services)
    ];

    // Combine all 5x categories
    const fiveXMCCs = [...restaurantMCCs, ...groceryMCCs, ...deliveryMCCs];

    // Eligible streaming service providers (check americanexpress.ca/streaming for updates)
    const streamingMerchants = [
      "Netflix",
      "Spotify",
      "Apple Music",
      "Disney+",
      "Disney Plus",
      "Amazon Prime Video",
      "Prime Video",
      "Crave",
      "HBO Max",
      "Paramount+",
      "Paramount Plus",
      "YouTube Premium",
      "Apple TV+",
      "Apple TV Plus",
      "Deezer",
      "Tidal",
      "SiriusXM Canada",
      "Audible",
    ];

    // MCCs for gas stations
    const gasMCCs = [
      "5541", // Service Stations (with or without ancillary services)
      "5542", // Automated Fuel Dispensers
    ];

    // MCCs for local commuter transportation
    const transportationMCCs = [
      "4111", // Local/Suburban Commuter Passenger Transportation
      "4121", // Taxicabs and Limousines
      "4131", // Bus Lines
      "4789", // Transportation Services (ride sharing)
      "4011", // Railroads (local commuter)
    ];

    // Combine all 2x categories
    const twoXMCCs = [...gasMCCs, ...transportationMCCs];

    // Rule 1: 5x on Restaurants, Groceries, and Food Delivery (CAD only)
    // Highest priority
    // Monthly spend cap: $2,500 CAD
    console.log(
      "Creating Rule 1: 5x on Restaurants, Groceries & Food Delivery (CAD only)..."
    );
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "5x Points on Food & Groceries",
      description:
        "Earn 5 points per $1 CAD at restaurants, groceries, and food delivery (up to $2,500 CAD monthly spend)",
      enabled: true,
      priority: 4, // Highest priority
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: fiveXMCCs,
        },
        {
          type: "currency",
          operation: "equals",
          values: ["CAD"],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 4, // 4 bonus + 1 base = 5x total
        pointsCurrency: "Membership Rewards",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: 10000, // $2,500 × 4 bonus multiplier = 10,000 bonus points
        monthlySpendPeriodType: "calendar",
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1 created\n");

    // Rule 2: 3x on Streaming Subscriptions (CAD only)
    console.log("Creating Rule 2: 3x on Streaming Subscriptions (CAD only)...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "3x Points on Streaming",
      description:
        "Earn 3 points per $1 CAD on eligible streaming subscriptions (matched by merchant name)",
      enabled: true,
      priority: 3,
      conditions: [
        {
          type: "merchant",
          operation: "include",
          values: streamingMerchants,
        },
        {
          type: "currency",
          operation: "equals",
          values: ["CAD"],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 2, // 2 bonus + 1 base = 3x total
        pointsCurrency: "Membership Rewards",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 2 created\n");

    // Rule 3: 2x on Gas Stations and Local Transportation (CAD only)
    console.log("Creating Rule 3: 2x on Gas & Transportation (CAD only)...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "2x Points on Gas & Transit",
      description:
        "Earn 2 points per $1 CAD at gas stations and local commuter transportation",
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
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1, // 1 bonus + 1 base = 2x total
        pointsCurrency: "Membership Rewards",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 3 created\n");

    // Rule 4: 1x on Everything Else (Base earn rate - all currencies)
    console.log("Creating Rule 4: 1x on All Other Purchases...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "1x Points on All Other Purchases",
      description:
        "Earn 1 point per $1 on all other eligible purchases (includes foreign currency transactions)",
      enabled: true,
      priority: 1, // Lowest priority - catch-all rule
      conditions: [], // No conditions - matches everything
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0, // No bonus, just base
        pointsCurrency: "Membership Rewards",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 4 created\n");

    console.log("=== Setup Complete ===\n");
    console.log(
      "✅ All rules created successfully for American Express Cobalt Card\n"
    );
    console.log("Summary:");
    console.log(
      "- Priority 4: 5x on restaurants, groceries & food delivery (CAD only, $2,500 monthly spend cap)"
    );
    console.log("- Priority 3: 3x on streaming subscriptions (CAD only)");
    console.log(
      "- Priority 2: 2x on gas stations & local transportation (CAD only)"
    );
    console.log("- Priority 1: 1x on everything else (all currencies)");
    console.log("\nImportant Notes:");
    console.log("1. Monthly spend cap: $2,500 CAD on 5x categories");
    console.log(
      "   - This equals 10,000 BONUS points per calendar month (4 × $2,500)"
    );
    console.log(
      "   - Base points (1x) are always earned, even after hitting the cap"
    );
    console.log("   - Cap resets on the 1st of each calendar month");
    console.log("2. Bonus points ONLY apply to CAD transactions");
    console.log("3. Foreign currency transactions earn 1x base points only");
    console.log(
      "4. Streaming must be from eligible providers (see americanexpress.ca/streaming)"
    );
  } catch (error) {
    console.error("❌ Failed to create rules:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
  }
}

// Run the setup
setupAmexCobaltCard().catch(console.error);
