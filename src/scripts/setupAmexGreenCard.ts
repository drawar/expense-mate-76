/**
 * Script to set up accurate reward rules for American Express Green Card (US)
 *
 * Rules:
 * 1. 3x on restaurants worldwide (excludes bars, nightclubs, cafeterias, convenience stores)
 * 2. 3x on flights booked directly with airlines or amextravel.com
 * 3. 3x on transit (trains, taxicabs, rideshare, ferries, tolls, parking, buses, subways)
 * 4. 1x on everything else
 *
 * Important:
 * - Restaurant bonus applies worldwide but excludes bars (5813), convenience stores (5499)
 * - Restaurant bonus excludes restaurants inside hotels/casinos/venues
 * - Restaurant bonus excludes third-party food delivery outside the US
 * - Flights bonus only for direct airline purchases or amextravel.com
 * - No monthly caps on any category
 * - Points round to nearest integer after multiplier calculation (same as Cobalt)
 * - 3x = 1 base + 2 bonus
 *
 * Usage: Run this from the browser console after logging into the app:
 *   1. Open the app in your browser
 *   2. Log in
 *   3. Open Developer Tools (F12) -> Console
 *   4. Import and run: (await import('/src/scripts/setupAmexGreenCard.ts')).setupAmexGreenCard()
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

export async function setupAmexGreenCard() {
  console.log("=== Setting Up American Express Green Card (US) ===\n");

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
    "Green"
  );
  console.log("Card Type ID:", cardTypeId, "\n");

  // Create or update the payment method record
  console.log("Creating/updating payment method record...");
  const paymentMethodId = `amex-green-${session.user.id.slice(0, 8)}`;

  const { error: pmError } = await supabase.from("payment_methods").upsert(
    {
      id: paymentMethodId,
      name: "Green",
      type: "credit_card",
      issuer: "American Express",
      currency: "USD",
      points_currency: "Membership Rewards Points (US)",
      is_active: true,
      statement_start_day: 10,
      is_monthly_statement: false,
      user_id: session.user.id,
      image_url:
        "https://icm.aexp-static.com/acquisition/card-art/NUS000000274_480x304_straight_withname.png",
    },
    { onConflict: "id" }
  );

  if (pmError) {
    console.error("❌ Failed to create payment method:", pmError);
    return;
  }
  console.log(
    "✅ Payment method created/updated with ID:",
    paymentMethodId,
    "\n"
  );

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
    // MCCs for restaurants (excludes bars 5813 and convenience stores 5499)
    // Note: 5813 (Drinking Places - Bars, Taverns, Nightclubs) is explicitly excluded
    // Note: 5499 (Misc Food Stores - convenience stores) is explicitly excluded
    const restaurantMCCs = [
      "5811", // Caterers
      "5812", // Eating Places, Restaurants
      "5814", // Fast Food Restaurants
    ];

    // MCCs for airlines (direct bookings)
    // 3000-3299 are specific airline MCCs, 4511 is general airlines
    const airlineMCCs = [
      ...Array.from({ length: 300 }, (_, i) => String(3000 + i)),
      "4511", // Airlines and Air Carriers
    ];

    // Amex Travel merchants for matching
    const amexTravelMerchants = [
      "AMEX TRAVEL",
      "AMEXTRAVEL",
      "AMERICAN EXPRESS TRAVEL",
      "AMEX VACATIONS",
    ];

    // MCCs for transit (trains, taxicabs, rideshare, ferries, tolls, parking, buses, subways)
    const transitMCCs = [
      "4011", // Railroads - Freight
      "4111", // Local/Suburban Commuter Passenger Transportation
      "4112", // Passenger Railways
      "4121", // Taxicabs and Limousines
      "4131", // Bus Lines
      "4468", // Ferries
      "4784", // Bridge and Road Fees, Tolls
      "4789", // Transportation Services (includes rideshare like Uber/Lyft)
      "7523", // Parking Lots and Garages
    ];

    // Rule 1: 3x on Restaurants Worldwide
    // Highest priority (4) - applies before flights and transit
    console.log("Creating Rule 1: 3x on Restaurants Worldwide...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "3x Points on Restaurants",
      description:
        "Earn 3 points per $1 at restaurants worldwide (excludes bars, nightclubs, convenience stores)",
      enabled: true,
      priority: 4, // Highest priority
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
        bonusMultiplier: 2, // 2 bonus + 1 base = 3x total
        pointsCurrency: "Membership Rewards Points (US)",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1 created (3x restaurants worldwide)\n");

    // Rule 2: 3x on Flights (direct airlines + Amex Travel)
    console.log("Creating Rule 2: 3x on Flights...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "3x Points on Flights",
      description:
        "Earn 3 points per $1 on flights booked directly with airlines or amextravel.com",
      enabled: true,
      priority: 3,
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: airlineMCCs,
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 2, // 2 bonus + 1 base = 3x total
        pointsCurrency: "Membership Rewards Points (US)",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 2 created (3x flights)\n");

    // Rule 2b: 3x on Amex Travel (merchant match)
    console.log("Creating Rule 2b: 3x on Amex Travel...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "3x Points on Amex Travel",
      description:
        "Earn 3 points per $1 on purchases through amextravel.com or Amex Travel App",
      enabled: true,
      priority: 3,
      conditions: [
        {
          type: "merchant",
          operation: "include",
          values: amexTravelMerchants,
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 2, // 2 bonus + 1 base = 3x total
        pointsCurrency: "Membership Rewards Points (US)",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 2b created (3x Amex Travel)\n");

    // Rule 3: 3x on Transit
    console.log("Creating Rule 3: 3x on Transit...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "3x Points on Transit",
      description:
        "Earn 3 points per $1 on transit including trains, buses, taxis, rideshares, ferries, tolls, and parking",
      enabled: true,
      priority: 2,
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: transitMCCs,
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 2, // 2 bonus + 1 base = 3x total
        pointsCurrency: "Membership Rewards Points (US)",
        pointsRoundingStrategy: "nearest",
        amountRoundingStrategy: "none",
        blockSize: 1,
        monthlyCap: null,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 3 created (3x transit)\n");

    // Rule 4: 1x on Everything Else (Base earn rate)
    console.log("Creating Rule 4: 1x on All Other Purchases...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "1x Points on All Other Purchases",
      description: "Earn 1 point per $1 on all other eligible purchases",
      enabled: true,
      priority: 1, // Lowest priority - catch-all rule
      conditions: [], // No conditions - matches everything
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0, // No bonus, just base
        pointsCurrency: "Membership Rewards Points (US)",
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
      "✅ All rules created successfully for American Express Green Card (US)\n"
    );
    console.log("Summary:");
    console.log(
      "- Priority 4: 3x on restaurants worldwide (excludes bars, nightclubs, convenience stores)"
    );
    console.log(
      "- Priority 3: 3x on flights (direct airline purchases + amextravel.com)"
    );
    console.log(
      "- Priority 2: 3x on transit (trains, buses, taxis, rideshares, ferries, tolls, parking)"
    );
    console.log("- Priority 1: 1x on everything else");
    console.log("\nImportant Notes:");
    console.log("1. No monthly caps on any categories");
    console.log("2. Restaurant bonus applies worldwide");
    console.log(
      "3. Restaurant bonus excludes bars (5813) and convenience stores (5499)"
    );
    console.log("4. Points round to nearest integer after calculation");
    console.log("5. Statement cycle starts on day 10 of each month");
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
    window as Window & { setupAmexGreenCard?: typeof setupAmexGreenCard }
  ).setupAmexGreenCard = setupAmexGreenCard;
}

// Export for module usage
export default setupAmexGreenCard;
