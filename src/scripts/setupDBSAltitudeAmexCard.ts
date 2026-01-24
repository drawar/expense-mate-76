/**
 * Script to set up DBS Altitude American Express Card (Singapore)
 *
 * Rules:
 * 1. SGD transactions: 3.25 DBS Points per S$5 spent = 0.65 pts per S$1
 *    Formula: ROUNDDOWN((converted_amount/5)*3.25, 0) = floor(amount * 0.65)
 *
 * 2. FCY transactions: 5.5 DBS Points per S$5 spent = 1.1 pts per S$1
 *    Formula: ROUNDDOWN((converted_amount/5)*5.5, 0) = floor(amount * 1.1)
 *
 * Important: Points are calculated on payment_amount (SGD), not transaction amount.
 * FCY transactions are identified by transaction currency != SGD.
 *
 * Run with: npx tsx src/scripts/setupDBSAltitudeAmexCard.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Load env file manually
const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
}

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = "e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91";
const CARD_TYPE_ID = "dbs-altitude-american-express";
const CARD_NAME = "Altitude American Express";
const ISSUER = "DBS";
const REGION = "SG";
const CURRENCY = "SGD";
const POINTS_CURRENCY = "DBS Points";

async function setupDBSAltitudeAmexCard() {
  console.log("=== Setting Up DBS Altitude American Express Card (Singapore) ===\n");

  // Step 1: Get reward_currency_id for DBS Points
  console.log("Step 1: Finding DBS Points reward currency...");
  const { data: rewardCurrency, error: rcError } = await supabase
    .from("reward_currencies")
    .select("id")
    .eq("code", "dbs_points")
    .single();

  if (rcError || !rewardCurrency) {
    console.error("Error finding DBS Points reward currency:", rcError);
    return;
  }
  console.log("  Found reward_currency_id:", rewardCurrency.id, "\n");

  // Step 2: Check if card already exists in catalog
  console.log("Step 2: Checking card catalog...");
  const { data: existingCard } = await supabase
    .from("card_catalog")
    .select("id")
    .eq("card_type_id", CARD_TYPE_ID)
    .single();

  let cardCatalogId: string;

  if (existingCard) {
    console.log("  Card already exists in catalog, updating...");
    cardCatalogId = existingCard.id;

    const { error: updateError } = await supabase
      .from("card_catalog")
      .update({
        name: CARD_NAME,
        issuer: ISSUER,
        network: "amex",
        currency: CURRENCY,
        points_currency: POINTS_CURRENCY,
        reward_currency_id: rewardCurrency.id,
        region: REGION,
        has_categories: false,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cardCatalogId);

    if (updateError) {
      console.error("  Error updating card catalog:", updateError);
      return;
    }
    console.log("  Card catalog updated\n");
  } else {
    console.log("  Creating new card in catalog...");
    const { data: newCard, error: insertError } = await supabase
      .from("card_catalog")
      .insert({
        card_type_id: CARD_TYPE_ID,
        name: CARD_NAME,
        issuer: ISSUER,
        network: "amex",
        currency: CURRENCY,
        points_currency: POINTS_CURRENCY,
        reward_currency_id: rewardCurrency.id,
        region: REGION,
        has_categories: false,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertError || !newCard) {
      console.error("  Error creating card catalog entry:", insertError);
      return;
    }
    cardCatalogId = newCard.id;
    console.log("  Card catalog entry created with ID:", cardCatalogId, "\n");
  }

  // Step 3: Delete existing reward rules for this card
  console.log("Step 3: Cleaning up existing reward rules...");
  const { data: existingRules } = await supabase
    .from("reward_rules")
    .select("id")
    .eq("card_catalog_id", cardCatalogId);

  if (existingRules && existingRules.length > 0) {
    const { error: deleteError } = await supabase
      .from("reward_rules")
      .delete()
      .eq("card_catalog_id", cardCatalogId);

    if (deleteError) {
      console.error("  Error deleting existing rules:", deleteError);
      return;
    }
    console.log("  Deleted", existingRules.length, "existing rule(s)\n");
  } else {
    console.log("  No existing rules to delete\n");
  }

  // Step 4: Create reward rules
  console.log("Step 4: Creating reward rules...\n");

  // Rule 1: FCY transactions (higher priority - 5.5 pts per $5)
  console.log("  Creating Rule 1: FCY transactions (5.5 pts per S$5)...");
  const { error: rule1Error } = await supabase.from("reward_rules").insert({
    card_catalog_id: cardCatalogId,
    name: "5.5x Points on Foreign Currency",
    description: "Earn 5.5 DBS Points per S$5 spent on foreign currency transactions",
    enabled: true,
    priority: 2, // Higher priority - check this first
    conditions: JSON.stringify([
      {
        type: "currency",
        operation: "exclude",
        values: ["SGD"], // Transaction currency is NOT SGD
      },
    ]),
    calculation_method: "standard",
    base_multiplier: 1.1, // 5.5/5 = 1.1 pts per $1
    bonus_multiplier: 0,
    points_rounding_strategy: "floor",
    amount_rounding_strategy: "none",
    block_size: 1,
    bonus_tiers: JSON.stringify([]),
  });

  if (rule1Error) {
    console.error("  Error creating Rule 1:", rule1Error);
    return;
  }
  console.log("  Rule 1 created\n");

  // Rule 2: SGD transactions (lower priority - 3.25 pts per $5)
  console.log("  Creating Rule 2: SGD transactions (3.25 pts per S$5)...");
  const { error: rule2Error } = await supabase.from("reward_rules").insert({
    card_catalog_id: cardCatalogId,
    name: "3.25x Points on SGD",
    description: "Earn 3.25 DBS Points per S$5 spent on Singapore Dollar transactions",
    enabled: true,
    priority: 1, // Lower priority - fallback/catch-all
    conditions: JSON.stringify([]), // No conditions - matches everything (SGD by default)
    calculation_method: "standard",
    base_multiplier: 0.65, // 3.25/5 = 0.65 pts per $1
    bonus_multiplier: 0,
    points_rounding_strategy: "floor",
    amount_rounding_strategy: "none",
    block_size: 1,
    bonus_tiers: JSON.stringify([]),
  });

  if (rule2Error) {
    console.error("  Error creating Rule 2:", rule2Error);
    return;
  }
  console.log("  Rule 2 created\n");

  // Step 5: Create or update payment method
  console.log("Step 5: Setting up payment method...");
  const { data: existingPM } = await supabase
    .from("payment_methods")
    .select("id")
    .eq("name", CARD_NAME)
    .eq("issuer", ISSUER)
    .eq("user_id", USER_ID)
    .single();

  if (existingPM) {
    console.log("  Payment method already exists, updating card_catalog_id...");
    const { error: updatePMError } = await supabase
      .from("payment_methods")
      .update({
        card_catalog_id: cardCatalogId,
        reward_currency_id: rewardCurrency.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingPM.id);

    if (updatePMError) {
      console.error("  Error updating payment method:", updatePMError);
    } else {
      console.log("  Payment method updated with card_catalog_id\n");
    }
  } else {
    console.log("  Creating new payment method...");
    const { error: createPMError } = await supabase.from("payment_methods").insert({
      name: CARD_NAME,
      type: "credit_card",
      issuer: ISSUER,
      currency: CURRENCY,
      points_currency: POINTS_CURRENCY,
      reward_currency_id: rewardCurrency.id,
      card_catalog_id: cardCatalogId,
      is_active: true,
      user_id: USER_ID,
    });

    if (createPMError) {
      console.error("  Error creating payment method:", createPMError);
    } else {
      console.log("  Payment method created\n");
    }
  }

  // Summary
  console.log("=".repeat(60));
  console.log("SETUP COMPLETE");
  console.log("=".repeat(60));
  console.log("\nCard Details:");
  console.log("  Name:", CARD_NAME);
  console.log("  Issuer:", ISSUER);
  console.log("  Card Type ID:", CARD_TYPE_ID);
  console.log("  Card Catalog ID:", cardCatalogId);
  console.log("  Currency:", CURRENCY);
  console.log("  Points Currency:", POINTS_CURRENCY);
  console.log("\nReward Rules:");
  console.log("  Priority 2: FCY transactions → 1.1 pts/S$1 (5.5 pts per S$5)");
  console.log("  Priority 1: SGD transactions → 0.65 pts/S$1 (3.25 pts per S$5)");
  console.log("\nFormulas:");
  console.log("  SGD: ROUNDDOWN((converted_amount/5)*3.25, 0)");
  console.log("  FCY: ROUNDDOWN((converted_amount/5)*5.5, 0)");
  console.log("\nExample calculations:");
  console.log("  S$100 SGD purchase: floor(100 * 0.65) = 65 pts");
  console.log("  S$100 FCY purchase: floor(100 * 1.1) = 110 pts");
  console.log("  S$47.50 SGD purchase: floor(47.50 * 0.65) = floor(30.875) = 30 pts");
  console.log("  S$47.50 FCY purchase: floor(47.50 * 1.1) = floor(52.25) = 52 pts");
}

setupDBSAltitudeAmexCard().catch(console.error);
