/**
 * Script to add American Express Green (US) to the card catalog
 *
 * Usage: Run this from the browser console after logging into the app:
 *   1. Open the app in your browser
 *   2. Log in
 *   3. Open Developer Tools (F12) -> Console
 *   4. Import and run: (await import('/src/scripts/addAmexGreenToCatalog.ts')).addAmexGreenToCatalog()
 */

import { supabase } from "@/integrations/supabase/client";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

export async function addAmexGreenToCatalog() {
  console.log("=== Adding American Express Green (US) to Card Catalog ===\n");

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

  // Check if card already exists
  const { data: existing } = await supabase
    .from("card_catalog")
    .select("id, name, issuer, region")
    .eq("card_type_id", cardTypeId);

  if (existing && existing.length > 0) {
    console.log("⚠️ Card already exists in catalog:", existing);
    console.log("Skipping creation.\n");
    return;
  }

  // Insert the new card
  console.log("Creating card catalog entry...");
  const { data, error } = await supabase
    .from("card_catalog")
    .insert({
      card_type_id: cardTypeId,
      name: "Green",
      issuer: "American Express",
      network: "amex",
      currency: "USD",
      points_currency: "Membership Rewards Points (US)",
      default_image_url:
        "https://icm.aexp-static.com/acquisition/card-art/NUS000000274_480x304_straight_withname.png",
      region: "US",
      has_categories: false,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("❌ Failed to create card catalog entry:", error);
    return;
  }

  console.log("✅ Card catalog entry created successfully!");
  console.log("Card ID:", data.id);
  console.log("Card Type ID:", data.card_type_id);
  console.log("\n=== Done ===\n");
}

/**
 * Utility to check for duplicate entries in the card catalog
 */
export async function checkCatalogDuplicates() {
  console.log("=== Checking for Duplicate Card Catalog Entries ===\n");

  const { data, error } = await supabase
    .from("card_catalog")
    .select("id, card_type_id, name, issuer, region, is_active")
    .order("issuer")
    .order("name");

  if (error) {
    console.error("❌ Failed to fetch catalog:", error);
    return;
  }

  // Group by card_type_id to find duplicates
  const byTypeId = new Map<string, typeof data>();
  for (const card of data || []) {
    const existing = byTypeId.get(card.card_type_id) || [];
    existing.push(card);
    byTypeId.set(card.card_type_id, existing);
  }

  // Find duplicates
  let hasDuplicates = false;
  for (const [typeId, cards] of byTypeId) {
    if (cards.length > 1) {
      hasDuplicates = true;
      console.log(`⚠️ Duplicate found for "${typeId}":`);
      for (const card of cards) {
        console.log(
          `  - ID: ${card.id}, Region: ${card.region}, Active: ${card.is_active}`
        );
      }
      console.log("");
    }
  }

  if (!hasDuplicates) {
    console.log("✅ No duplicates found in card catalog.\n");
  }

  // Also check Amex cards specifically
  console.log("\n=== American Express Cards in Catalog ===");
  const amexCards = (data || []).filter((c) =>
    c.issuer.toLowerCase().includes("american express")
  );
  for (const card of amexCards) {
    console.log(
      `- ${card.name} (${card.region}): ${card.card_type_id} [Active: ${card.is_active}]`
    );
  }
}

// Make available globally for browser console execution
if (typeof window !== "undefined") {
  (
    window as Window & {
      addAmexGreenToCatalog?: typeof addAmexGreenToCatalog;
      checkCatalogDuplicates?: typeof checkCatalogDuplicates;
    }
  ).addAmexGreenToCatalog = addAmexGreenToCatalog;
  (
    window as Window & {
      checkCatalogDuplicates?: typeof checkCatalogDuplicates;
    }
  ).checkCatalogDuplicates = checkCatalogDuplicates;
}

export default addAmexGreenToCatalog;
