/**
 * Script to add RBC ION+ Visa to the card catalog
 *
 * Usage: Run this from the browser console after logging into the app:
 *   1. Open the app in your browser
 *   2. Log in
 *   3. Open Developer Tools (F12) -> Console
 *   4. Import and run: (await import('/src/scripts/addRBCIonPlusToCatalog.ts')).addRBCIonPlusToCatalog()
 */

import { supabase } from "@/integrations/supabase/client";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

export async function addRBCIonPlusToCatalog() {
  console.log("=== Adding RBC ION+ Visa to Card Catalog ===\n");

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
  const cardTypeId = cardTypeIdService.generateCardTypeId("RBC", "ION+");
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
      name: "ION+",
      issuer: "RBC",
      network: "visa",
      currency: "CAD",
      points_currency: "Avion Rewards Points",
      reward_currency_id: "e4dc838a-5c0c-420a-893c-329938b0cf1f",
      default_image_url:
        "https://www.rbcroyalbank.com/credit-cards/canada/rewards/images/rbc-ion-plus-visa.webp",
      region: "CA",
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

// Make available globally for browser console execution
if (typeof window !== "undefined") {
  (
    window as Window & {
      addRBCIonPlusToCatalog?: typeof addRBCIonPlusToCatalog;
    }
  ).addRBCIonPlusToCatalog = addRBCIonPlusToCatalog;
}

export default addRBCIonPlusToCatalog;
