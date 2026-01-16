/**
 * Node.js script to set up reward rules for American Express Green Card
 *
 * Rules:
 * 1. 3x on restaurants worldwide (excludes bars, nightclubs, cafeterias, convenience stores)
 * 2. 3x on flights booked directly with airlines or amextravel.com
 * 3. 3x on transit (trains, taxicabs, rideshare, ferries, tolls, parking, buses, subways)
 * 4. 1x on everything else
 *
 * Run with:
 * VITE_SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." npx tsx src/scripts/setupAmexGreenCard.node.ts
 */
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupAmexGreenCard() {
  console.log("=== Setting Up American Express Green Card Rules ===\n");

  // Get the card_catalog entry for Amex Green
  const { data: catalogEntry, error: catalogError } = await supabase
    .from("card_catalog")
    .select("id, card_type_id")
    .eq("card_type_id", "american-express-green")
    .single();

  if (catalogError || !catalogEntry) {
    console.error("❌ Amex Green not found in card_catalog:", catalogError);
    return;
  }

  const cardCatalogId = catalogEntry.id;
  const cardTypeId = catalogEntry.card_type_id;
  console.log("Card Catalog ID:", cardCatalogId);
  console.log("Card Type ID:", cardTypeId);
  console.log("");

  // Delete existing rules for this card
  console.log("Cleaning up existing rules...");
  const { data: existingRules } = await supabase
    .from("reward_rules")
    .select("id")
    .or(`card_type_id.eq.${cardTypeId},card_catalog_id.eq.${cardCatalogId}`);

  if (existingRules && existingRules.length > 0) {
    const { error: deleteError } = await supabase
      .from("reward_rules")
      .delete()
      .in(
        "id",
        existingRules.map((r) => r.id)
      );

    if (deleteError) {
      console.error("❌ Failed to delete existing rules:", deleteError);
    } else {
      console.log(`✅ Deleted ${existingRules.length} existing rule(s)\n`);
    }
  }

  // MCCs for restaurants (excludes bars 5813 and convenience stores 5499)
  const restaurantMCCs = [
    "5811", // Caterers
    "5812", // Eating Places, Restaurants
    "5814", // Fast Food Restaurants
  ];

  // MCCs for airlines (direct bookings)
  const airlineMCCs = [
    ...Array.from({ length: 300 }, (_, i) => String(3000 + i)),
    "4511", // Airlines and Air Carriers
  ];

  // Amex Travel merchants
  const amexTravelMerchants = [
    "AMEX TRAVEL",
    "AMEXTRAVEL",
    "AMERICAN EXPRESS TRAVEL",
    "AMEX VACATIONS",
  ];

  // MCCs for transit
  const transitMCCs = [
    "4011", // Railroads - Freight
    "4111", // Local/Suburban Commuter Passenger Transportation
    "4112", // Passenger Railways
    "4121", // Taxicabs and Limousines
    "4131", // Bus Lines
    "4468", // Ferries
    "4784", // Bridge and Road Fees, Tolls
    "4789", // Transportation Services (rideshare)
    "7523", // Parking Lots and Garages
  ];

  const now = new Date().toISOString();

  const rules = [
    {
      id: uuidv4(),
      card_type_id: cardTypeId,
      card_catalog_id: cardCatalogId,
      name: "3x Points on Restaurants",
      description:
        "Earn 3 points per $1 at restaurants worldwide (excludes bars, nightclubs, convenience stores)",
      enabled: true,
      priority: 4,
      conditions: JSON.stringify([
        { type: "mcc", operation: "include", values: restaurantMCCs },
      ]),
      calculation_method: "standard",
      base_multiplier: 1,
      bonus_multiplier: 2,
      points_rounding_strategy: "nearest",
      amount_rounding_strategy: "none",
      block_size: 1,
      bonus_tiers: JSON.stringify([]),
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      card_type_id: cardTypeId,
      card_catalog_id: cardCatalogId,
      name: "3x Points on Flights",
      description:
        "Earn 3 points per $1 on flights booked directly with airlines or amextravel.com",
      enabled: true,
      priority: 3,
      conditions: JSON.stringify([
        { type: "mcc", operation: "include", values: airlineMCCs },
      ]),
      calculation_method: "standard",
      base_multiplier: 1,
      bonus_multiplier: 2,
      points_rounding_strategy: "nearest",
      amount_rounding_strategy: "none",
      block_size: 1,
      bonus_tiers: JSON.stringify([]),
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      card_type_id: cardTypeId,
      card_catalog_id: cardCatalogId,
      name: "3x Points on Amex Travel",
      description:
        "Earn 3 points per $1 on purchases through amextravel.com or Amex Travel App",
      enabled: true,
      priority: 3,
      conditions: JSON.stringify([
        { type: "merchant", operation: "include", values: amexTravelMerchants },
      ]),
      calculation_method: "standard",
      base_multiplier: 1,
      bonus_multiplier: 2,
      points_rounding_strategy: "nearest",
      amount_rounding_strategy: "none",
      block_size: 1,
      bonus_tiers: JSON.stringify([]),
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      card_type_id: cardTypeId,
      card_catalog_id: cardCatalogId,
      name: "3x Points on Transit",
      description:
        "Earn 3 points per $1 on transit including trains, buses, taxis, rideshares, ferries, tolls, and parking",
      enabled: true,
      priority: 2,
      conditions: JSON.stringify([
        { type: "mcc", operation: "include", values: transitMCCs },
      ]),
      calculation_method: "standard",
      base_multiplier: 1,
      bonus_multiplier: 2,
      points_rounding_strategy: "nearest",
      amount_rounding_strategy: "none",
      block_size: 1,
      bonus_tiers: JSON.stringify([]),
      created_at: now,
      updated_at: now,
    },
    {
      id: uuidv4(),
      card_type_id: cardTypeId,
      card_catalog_id: cardCatalogId,
      name: "1x Points on All Other Purchases",
      description: "Earn 1 point per $1 on all other eligible purchases",
      enabled: true,
      priority: 1,
      conditions: JSON.stringify([]),
      calculation_method: "standard",
      base_multiplier: 1,
      bonus_multiplier: 0,
      points_rounding_strategy: "nearest",
      amount_rounding_strategy: "none",
      block_size: 1,
      bonus_tiers: JSON.stringify([]),
      created_at: now,
      updated_at: now,
    },
  ];

  console.log("Creating rules...");
  for (const rule of rules) {
    const { error } = await supabase.from("reward_rules").insert(rule);

    if (error) {
      console.error(`❌ Failed to create rule "${rule.name}":`, error.message);
    } else {
      console.log(`✓ Created: ${rule.name}`);
    }
  }

  console.log("\n=== Setup Complete ===");
  console.log("\nSummary:");
  console.log("- Priority 4: 3x on restaurants worldwide");
  console.log("- Priority 3: 3x on flights (direct airline + amextravel.com)");
  console.log("- Priority 3: 3x on Amex Travel");
  console.log("- Priority 2: 3x on transit");
  console.log("- Priority 1: 1x on everything else");
}

setupAmexGreenCard();
