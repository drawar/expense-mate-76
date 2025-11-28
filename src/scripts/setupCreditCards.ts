/**
 * Script to set up reward rules for three credit cards:
 * 1. American Express Cobalt (Canada)
 * 2. Citibank Rewards Visa Signature (Singapore)
 * 3. American Express Aeroplan Reserve (Canada)
 */

import { supabase } from "@/integrations/supabase/client";
import {
  initializeRuleRepository,
  getRuleRepository,
} from "@/core/rewards/RuleRepository";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";
import { RewardRule } from "@/core/rewards/types";

async function setupCreditCards() {
  console.log("=== Setting Up Credit Cards ===\n");

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

  // Card 1: American Express Cobalt (Canada)
  console.log("1. Setting up American Express Cobalt (Canada)...");
  const cobaltCardTypeId = cardTypeIdService.generateCardTypeId(
    "American Express",
    "Cobalt"
  );
  console.log("   Card Type ID:", cobaltCardTypeId);

  try {
    // 5x points on eligible eats & drinks
    await repository.createRule({
      cardTypeId: cobaltCardTypeId,
      name: "5x Points on Eats & Drinks",
      description: "Earn 5x points on eligible eats and drinks purchases",
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: ["5812", "5813", "5814"], // Restaurants, bars, drinking places
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 4, // 4 bonus + 1 base = 5x total
        pointsCurrency: "MR",
        monthlyCap: null,
        bonusTiers: [],
      },
    });

    // 3x points on streaming services
    await repository.createRule({
      cardTypeId: cobaltCardTypeId,
      name: "3x Points on Streaming",
      description: "Earn 3x points on eligible streaming subscriptions",
      enabled: true,
      priority: 9,
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: ["4899", "7841"], // Cable/streaming services
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 2, // 2 bonus + 1 base = 3x total
        pointsCurrency: "MR",
        monthlyCap: null,
        bonusTiers: [],
      },
    });

    // 2x points on transit and gas
    await repository.createRule({
      cardTypeId: cobaltCardTypeId,
      name: "2x Points on Transit & Gas",
      description: "Earn 2x points on transit and gas station purchases",
      enabled: true,
      priority: 8,
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: ["4111", "4112", "4121", "4131", "5541", "5542"], // Transit and gas
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1, // 1 bonus + 1 base = 2x total
        pointsCurrency: "MR",
        monthlyCap: null,
        bonusTiers: [],
      },
    });

    // 1x points on everything else
    await repository.createRule({
      cardTypeId: cobaltCardTypeId,
      name: "1x Points on All Other Purchases",
      description: "Earn 1x points on all other eligible purchases",
      enabled: true,
      priority: 1,
      conditions: [],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0,
        pointsCurrency: "MR",
        monthlyCap: null,
        bonusTiers: [],
      },
    });

    console.log("✅ American Express Cobalt rules created\n");
  } catch (error) {
    console.error("❌ Failed to create Cobalt rules:", error);
  }

  // Card 2: Citibank Rewards Visa Signature (Singapore)
  console.log("2. Setting up Citibank Rewards Visa Signature (Singapore)...");
  const citiCardTypeId = cardTypeIdService.generateCardTypeId(
    "Citibank",
    "Rewards Visa Signature"
  );
  console.log("   Card Type ID:", citiCardTypeId);

  try {
    // 10x points on online spend (capped at SGD 2,000/month)
    await repository.createRule({
      cardTypeId: citiCardTypeId,
      name: "10x Points on Online Spend",
      description:
        "Earn 10x points on online purchases (capped at SGD 2,000/month)",
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: "online",
          operation: "equals",
          values: ["true"],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 9, // 9 bonus + 1 base = 10x total
        pointsCurrency: "Citi Points",
        monthlyCap: 20000, // 2000 SGD * 10 points
        bonusTiers: [],
      },
    });

    // 2x points on dining
    await repository.createRule({
      cardTypeId: citiCardTypeId,
      name: "2x Points on Dining",
      description: "Earn 2x points on dining purchases",
      enabled: true,
      priority: 9,
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: ["5812", "5813", "5814"],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1, // 1 bonus + 1 base = 2x total
        pointsCurrency: "Citi Points",
        monthlyCap: null,
        bonusTiers: [],
      },
    });

    // 1x points on everything else
    await repository.createRule({
      cardTypeId: citiCardTypeId,
      name: "1x Points on All Other Purchases",
      description: "Earn 1x points on all other eligible purchases",
      enabled: true,
      priority: 1,
      conditions: [],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 0,
        pointsCurrency: "Citi Points",
        monthlyCap: null,
        bonusTiers: [],
      },
    });

    console.log("✅ Citibank Rewards Visa Signature rules created\n");
  } catch (error) {
    console.error("❌ Failed to create Citibank rules:", error);
  }

  // Card 3: American Express Aeroplan Reserve (Canada)
  console.log("3. Setting up American Express Aeroplan Reserve (Canada)...");
  const aeroplanCardTypeId = cardTypeIdService.generateCardTypeId(
    "American Express",
    "Aeroplan Reserve"
  );
  console.log("   Card Type ID:", aeroplanCardTypeId);

  try {
    // 3x points on Air Canada purchases
    await repository.createRule({
      cardTypeId: aeroplanCardTypeId,
      name: "3x Points on Air Canada",
      description: "Earn 3x points on Air Canada purchases",
      enabled: true,
      priority: 10,
      conditions: [
        {
          type: "merchant",
          operation: "include",
          values: ["Air Canada", "AIR CANADA"],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 2, // 2 bonus + 1 base = 3x total
        pointsCurrency: "Aeroplan",
        monthlyCap: null,
        bonusTiers: [],
      },
    });

    // 2x points on dining, groceries, and travel
    await repository.createRule({
      cardTypeId: aeroplanCardTypeId,
      name: "2x Points on Dining, Groceries & Travel",
      description: "Earn 2x points on dining, groceries, and travel purchases",
      enabled: true,
      priority: 9,
      conditions: [
        {
          type: "mcc",
          operation: "include",
          values: [
            "5812",
            "5813",
            "5814", // Dining
            "5411",
            "5422",
            "5441",
            "5451",
            "5462", // Groceries
            "3000-3299",
            "4511",
            "4722", // Travel
          ],
        },
      ],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1,
        bonusMultiplier: 1, // 1 bonus + 1 base = 2x total
        pointsCurrency: "Aeroplan",
        monthlyCap: null,
        bonusTiers: [],
      },
    });

    // 1.25x points on everything else
    await repository.createRule({
      cardTypeId: aeroplanCardTypeId,
      name: "1.25x Points on All Other Purchases",
      description: "Earn 1.25x points on all other eligible purchases",
      enabled: true,
      priority: 1,
      conditions: [],
      reward: {
        calculationMethod: "standard",
        baseMultiplier: 1.25,
        bonusMultiplier: 0,
        pointsCurrency: "Aeroplan",
        monthlyCap: null,
        bonusTiers: [],
      },
    });

    console.log("✅ American Express Aeroplan Reserve rules created\n");
  } catch (error) {
    console.error("❌ Failed to create Aeroplan Reserve rules:", error);
  }

  console.log("=== Setup Complete ===");
  console.log("\nNext steps:");
  console.log("1. Create payment methods in the app with these exact names:");
  console.log("   - Issuer: 'American Express', Name: 'Cobalt'");
  console.log("   - Issuer: 'Citibank', Name: 'Rewards Visa Signature'");
  console.log("   - Issuer: 'American Express', Name: 'Aeroplan Reserve'");
  console.log(
    "2. The reward rules will automatically be associated with these cards"
  );
}

// Run the setup
setupCreditCards().catch(console.error);
