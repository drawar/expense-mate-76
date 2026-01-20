/**
 * Script to set up accurate reward rules for HSBC Revolution Visa Platinum Card (Singapore)
 *
 * Promotional Period: Until February 28, 2026 (inclusive)
 *
 * Rules:
 * 1. 10x on Online Travel (airlines, car rental, lodging, cruise) - ONLINE transactions only
 * 2. 10x on Contactless (travel, retail, dining, transport) - CONTACTLESS transactions only
 * 3. 1x on everything else (base rate)
 *
 * Rounding:
 * - Base (1x): ROUND(amount, 0) * 1 (nearest rounding)
 * - Bonus (9x): ROUNDDOWN(amount, 0) * 9 (floor rounding)
 *
 * Cap: 13,500 bonus points per calendar month (shared between online and contactless)
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

async function setupHSBCRevolutionCard() {
  console.log(
    "=== Setting Up HSBC Revolution Visa Platinum Card (Singapore) ===\n"
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
    "HSBC",
    "Revolution Visa Platinum"
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

  // Promotional period end date: February 28, 2026 (end of day, Singapore time)
  const promoEndDate = new Date("2026-02-28T23:59:59+08:00");

  // Shared cap group ID for the 13,500 bonus points monthly cap
  const sharedCapGroupId = "hsbc-revolution-10x-bonus-cap";

  try {
    // ==========================================
    // TRAVEL MCCs (for both Online and Contactless)
    // ==========================================

    // Airlines: 3000-3350, 4511
    const airlineMCCs = [
      ...Array.from({ length: 351 }, (_, i) => String(3000 + i)), // 3000-3350
      "4511", // Airlines
    ];

    // Car Rental: 3351-3500
    const carRentalMCCs = Array.from({ length: 150 }, (_, i) =>
      String(3351 + i)
    ); // 3351-3500

    // Lodging: 3501-3999, 7011
    const lodgingMCCs = [
      ...Array.from({ length: 499 }, (_, i) => String(3501 + i)), // 3501-3999
      "7011", // Hotels and motels
    ];

    // Cruise Lines
    const cruiseMCCs = ["4411"];

    // All travel MCCs combined
    const travelMCCs = [
      ...airlineMCCs,
      ...carRentalMCCs,
      ...lodgingMCCs,
      ...cruiseMCCs,
    ];

    // ==========================================
    // CONTACTLESS-ONLY MCCs (in addition to travel)
    // ==========================================

    // Department Stores and Retail Stores
    const retailMCCs = [
      "4816", // Computer Network/Information Services
      "5045", // Computers, Computer Peripheral Equipment, Software
      "5262", // Marketplaces
      "5309", // Duty Free Stores
      "5310", // Discount Stores
      "5311", // Department Stores
      "5331", // Variety Stores
      "5399", // Miscellaneous General Merchandise Stores
      "5611", // Men's and Boys' Clothing and Accessories Stores
      "5621", // Women's Ready to Wear Stores
      "5631", // Women's Accessory and Specialty Stores
      "5641", // Children's and Infants' Wear Stores
      "5651", // Family Clothing Stores
      "5655", // Sports Apparel, and Riding Apparel Stores
      "5661", // Shoe Stores
      "5691", // Men's and Women's Clothing Stores
      "5699", // Accessory and Apparel Stores–Miscellaneous
      "5732", // Electronics Sales
      "5733", // Music Stores–Musical Instruments, Pianos and Sheet Music
      "5734", // Computer Software Stores
      "5735", // Record Shops
      "5912", // Drug Stores and Pharmacies
      "5942", // Book Stores
      "5944", // Clock, Jewelry, Watch and Silverware Stores
      "5945", // Game, Toy and Hobby Shops
      "5946", // Camera and Photographic Supply Stores
      "5947", // Card, Gift, Novelty and Souvenir Shops
      "5948", // Leather Goods and Luggage Stores
      "5949", // Fabric, Needlework, Piece Goods and Sewing Stores
      "5964", // Direct Marketing–Catalog Merchants
      "5965", // Direct Marketing–Combination Catalog and Retail Merchant
      "5966", // Direct Marketing–Outbound Telemarketing Merchants
      "5967", // Direct Marketing–Inbound Telemarketing Merchants
      "5968", // Direct Marketing–Continuity/Subscription Merchants
      "5969", // Direct Marketing–Other Direct Marketers–Not Elsewhere Classified
      "5970", // Artist Supply Stores, Craft Shops
      "5992", // Florists
      "5999", // Miscellaneous and Specialty Retail Stores
    ];

    // Dining (excluding hotel dining)
    const diningMCCs = [
      "5441", // Candy, Nut and Confectionery Stores
      "5462", // Bakeries
      "5811", // Caterers
      "5812", // Eating Places and Restaurants
      "5813", // Bars, Cocktail Lounges, Discotheques, Nightclubs and Taverns
    ];

    // Others (Transportation and Membership Clubs)
    const otherMCCs = [
      "4121", // Taxicabs and Limousines
      "7997", // Clubs–Country Clubs, Membership (Athletic, Recreation, Sports), Private Golf Courses
    ];

    // All contactless-eligible MCCs (travel + retail + dining + others)
    const contactlessMCCs = [
      ...travelMCCs,
      ...retailMCCs,
      ...diningMCCs,
      ...otherMCCs,
    ];

    // ==========================================
    // RULE 1: 10x on Online Travel (Promotional)
    // ==========================================
    console.log("Creating Rule 1: 10x on Online Travel (Promotional)...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "10x Points on Online Travel (Promo)",
      description:
        "Earn 10 points per SGD1 on online travel transactions (airlines, car rental, lodging, cruise). Valid until Feb 28, 2026.",
      enabled: true,
      priority: 3, // Highest priority
      validUntil: promoEndDate,
      conditions: [
        {
          type: "transaction_type",
          operation: "include",
          values: ["online"],
        },
        {
          type: "mcc",
          operation: "include",
          values: travelMCCs,
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9 bonus + 1 base = 10x total
        pointsCurrency: "HSBC Rewards Points",
        pointsRoundingStrategy: "floor", // ROUNDDOWN for bonus
        amountRoundingStrategy: "floor", // ROUNDDOWN(amount, 0)
        blockSize: 1,
        monthlyCap: 13500, // 13,500 bonus points cap
        monthlyCapType: "bonus_points",
        capPeriodicity: "calendar_month",
        capGroupId: sharedCapGroupId, // Shared cap with contactless
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 1 created\n");

    // ==========================================
    // RULE 2: 10x on Contactless (Promotional)
    // ==========================================
    console.log("Creating Rule 2: 10x on Contactless (Promotional)...");
    await repository.createRule({
      cardTypeId: cardTypeId,
      name: "10x Points on Contactless (Promo)",
      description:
        "Earn 10 points per SGD1 on contactless transactions (travel, retail, dining, transport). Valid until Feb 28, 2026.",
      enabled: true,
      priority: 2, // Second priority
      validUntil: promoEndDate,
      conditions: [
        {
          type: "transaction_type",
          operation: "include",
          values: ["contactless"],
        },
        {
          type: "mcc",
          operation: "include",
          values: contactlessMCCs,
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9 bonus + 1 base = 10x total
        pointsCurrency: "HSBC Rewards Points",
        pointsRoundingStrategy: "floor", // ROUNDDOWN for bonus
        amountRoundingStrategy: "floor", // ROUNDDOWN(amount, 0)
        blockSize: 1,
        monthlyCap: 13500, // 13,500 bonus points cap
        monthlyCapType: "bonus_points",
        capPeriodicity: "calendar_month",
        capGroupId: sharedCapGroupId, // Shared cap with online travel
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
      description:
        "Earn 1 point per SGD1 on all other eligible purchases (base rate, no expiration)",
      enabled: true,
      priority: 1, // Lowest priority - catch-all rule
      conditions: [], // No conditions - matches everything
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0, // No bonus, just base
        pointsCurrency: "HSBC Rewards Points",
        pointsRoundingStrategy: "nearest", // ROUND for base
        amountRoundingStrategy: "nearest", // ROUND(amount, 0)
        blockSize: 1,
        bonusTiers: [],
      },
    });
    console.log("✅ Rule 3 created\n");

    // ==========================================
    // CREATE PAYMENT METHOD (if not exists)
    // ==========================================
    console.log("Setting up payment method...");
    const { data: existingPaymentMethod } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("name", "Revolution Visa Platinum")
      .eq("issuer", "HSBC")
      .eq("user_id", session.user.id)
      .single();

    if (!existingPaymentMethod) {
      const { error: pmError } = await supabase.from("payment_methods").insert({
        name: "Revolution Visa Platinum",
        type: "credit_card",
        issuer: "HSBC",
        currency: "SGD",
        points_currency: "HSBC Rewards Points",
        is_active: true,
        user_id: session.user.id,
        statement_start_day: 29,
        is_monthly_statement: false,
      });

      if (pmError) {
        console.error("⚠️ Failed to create payment method:", pmError.message);
      } else {
        console.log("✅ Payment method created\n");
      }
    } else {
      console.log("✅ Payment method already exists\n");
    }

    console.log("=== Setup Complete ===\n");
    console.log(
      "✅ All rules created successfully for HSBC Revolution Visa Platinum\n"
    );
    console.log("Summary:");
    console.log(
      "- Priority 3: 10x on Online Travel (promo until Feb 28, 2026)"
    );
    console.log("- Priority 2: 10x on Contactless (promo until Feb 28, 2026)");
    console.log("- Priority 1: 1x on everything else (permanent)");
    console.log("\nImportant Notes:");
    console.log("1. Promotional 10x rate expires on February 28, 2026");
    console.log("2. Monthly bonus cap: 13,500 BONUS points per calendar month");
    console.log(
      "   - Shared between online travel and contactless transactions"
    );
    console.log("   - Cap resets on the 1st of each calendar month");
    console.log("3. Rounding:");
    console.log("   - Base (1x): ROUND(amount, 0) * 1");
    console.log("   - Bonus (9x): ROUNDDOWN(amount, 0) * 9");
    console.log("4. Online = transactions made via internet");
    console.log("5. Contactless = Visa payWave, Apple Pay, Google Pay");
    console.log(
      "\n⚠️ REMINDER: Promo ends Feb 28, 2026 - email reminder scheduled for Feb 25, 2026"
    );
  } catch (error) {
    console.error("❌ Failed to create rules:", error);
    if (error instanceof Error) {
      console.error("   Error message:", error.message);
    }
  }
}

// Run the setup
setupHSBCRevolutionCard().catch(console.error);
