/**
 * Script to manually set up reward rules for HSBC TravelOne card
 *
 * Run in browser console:
 * 1. Go to the Payment Methods page
 * 2. Open browser dev tools (F12)
 * 3. Go to Console tab
 * 4. Paste this script and press Enter
 *
 * Or run via CLI:
 * npx tsx src/scripts/setupHSBCTravelOneCard.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

async function setupHSBCTravelOne() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Find the HSBC TravelOne payment method
  const { data: paymentMethods, error: pmError } = await supabase
    .from("payment_methods")
    .select("id, name, issuer")
    .or("name.ilike.%travelone%,name.ilike.%travel one%")
    .ilike("issuer", "%hsbc%");

  if (pmError) {
    console.error("Error finding payment method:", pmError);
    return;
  }

  if (!paymentMethods || paymentMethods.length === 0) {
    console.log("No HSBC TravelOne card found. Looking for any HSBC card...");

    const { data: hsbcCards } = await supabase
      .from("payment_methods")
      .select("id, name, issuer")
      .ilike("issuer", "%hsbc%");

    if (hsbcCards && hsbcCards.length > 0) {
      console.log("Found HSBC cards:");
      hsbcCards.forEach((c) => console.log(`  - ${c.name} (${c.id})`));
      console.log("\nPlease specify the card ID to set up rules for.");
    } else {
      console.log("No HSBC cards found in your payment methods.");
    }
    return;
  }

  const card = paymentMethods[0];
  console.log(`Found HSBC TravelOne: ${card.name} (${card.id})`);

  // Generate card_type_id
  const cardTypeId = "hsbc-travelone";

  // Delete existing rules for this card
  const { error: deleteError } = await supabase
    .from("reward_rules")
    .delete()
    .eq("card_type_id", cardTypeId);

  if (deleteError) {
    console.error("Error deleting existing rules:", deleteError);
  }

  // Create 6x foreign currency rule
  const { error: foreignError } = await supabase.from("reward_rules").insert({
    card_type_id: cardTypeId,
    name: "6x Points on Foreign Currency",
    description:
      "Earn 6 HSBC Rewards Points per S$1 on foreign currency transactions (= 2.4 mpd at best transfer ratio)",
    enabled: true,
    priority: 2,
    conditions: [
      { type: "currency", operation: "not_equals", values: ["SGD"] },
    ],
    calculation_method: "standard",
    base_multiplier: 1,
    bonus_multiplier: 5,
    points_rounding_strategy: "floor",
    amount_rounding_strategy: "none",
    block_size: 1,
  });

  if (foreignError) {
    console.error("Error creating foreign currency rule:", foreignError);
    return;
  }
  console.log("✓ Created: 6x Points on Foreign Currency");

  // Create 3x local spend rule (catch-all)
  const { error: localError } = await supabase.from("reward_rules").insert({
    card_type_id: cardTypeId,
    name: "3x Points on Local Spend",
    description:
      "Earn 3 HSBC Rewards Points per S$1 on local SGD transactions (= 1.2 mpd at best transfer ratio)",
    enabled: true,
    priority: 1,
    conditions: [],
    calculation_method: "standard",
    base_multiplier: 1,
    bonus_multiplier: 2,
    points_rounding_strategy: "floor",
    amount_rounding_strategy: "none",
    block_size: 1,
  });

  if (localError) {
    console.error("Error creating local spend rule:", localError);
    return;
  }
  console.log("✓ Created: 3x Points on Local Spend");

  console.log("\n✅ HSBC TravelOne reward rules set up successfully!");
  console.log("Refresh the page to see the new rules.");
}

setupHSBCTravelOne().catch(console.error);
