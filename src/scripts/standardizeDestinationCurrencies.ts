/**
 * Script to standardize destination currency names
 *
 * Removes airline names and adds correct unit type (Miles/Points/Avios)
 * Based on official program naming conventions
 *
 * Usage: npx tsx src/scripts/standardizeDestinationCurrencies.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env file manually
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Mapping of old names to new standardized names
 *
 * Research sources:
 * - Club Premier: Uses kilometers (Mexican program)
 * - ANA Mileage Club: Uses miles
 * - Emirates Skywards: Uses "Skywards Miles"
 * - Qantas Frequent Flyer: Uses "Qantas Points" (not miles)
 * - British Airways: Just "Avios"
 * - Qatar: Switched to Avios in 2022
 * - Etihad Guest: Uses "Guest Miles"
 * - Fortune Wings: Uses points
 * - JetBlue TrueBlue: Uses points
 * - Delta SkyMiles: Just "SkyMiles"
 * - Virgin Atlantic: Uses "Flying Club Miles"
 */
const NAME_STANDARDIZATION: { oldName: string; newName: string }[] = [
  // Remove airline names, add unit type
  { oldName: "Aeromexico Club Premier", newName: "Club Premier Kilometers" },
  { oldName: "ANA Mileage Club", newName: "Mileage Club Miles" },
  { oldName: "Avianca LifeMiles", newName: "LifeMiles" },
  { oldName: "Delta SkyMiles", newName: "SkyMiles" },
  { oldName: "Emirates Skywards", newName: "Skywards Miles" },
  { oldName: "Etihad Guest", newName: "Guest Miles" },
  { oldName: "Iberia Plus Avios", newName: "Plus Avios" },
  { oldName: "JAL Mileage Bank", newName: "Mileage Bank Miles" },
  { oldName: "JetBlue TrueBlue", newName: "TrueBlue Points" },
  { oldName: "Qantas Frequent Flyer", newName: "Frequent Flyer Points" },
  { oldName: "Qatar Privilege Club", newName: "Privilege Club Avios" },
  { oldName: "United MileagePlus", newName: "MileagePlus Miles" },
  { oldName: "Virgin Atlantic Flying Club", newName: "Flying Club Miles" },

  // Add missing unit type (no airline name to remove)
  { oldName: "Infinity MileageLands", newName: "MileageLands Miles" },
  { oldName: "Fortune Wings Club", newName: "Fortune Wings Points" },
  { oldName: "Royal Orchid Plus", newName: "Royal Orchid Plus Miles" },

  // Already correct - no changes needed:
  // - Aeroplan Points (Air Canada's brand, already has "Points")
  // - Amazon Rewards (not an airline program)
  // - Asia Miles (official brand name)
  // - Avios (just the currency name)
  // - Choice Privileges (hotel program)
  // - Flying Blue Miles (already correct)
  // - Hilton Honors (hotel program)
  // - IHG Rewards (hotel program)
  // - KrisFlyer Miles (already correct)
  // - LotuSmiles (official brand)
  // - Miles&Smiles (official brand)
];

async function standardizeCurrencies() {
  console.log("=== Standardizing Destination Currency Names ===\n");

  // Get all destination currencies
  const { data: currencies, error: fetchErr } = await supabase
    .from("reward_currencies")
    .select("id, display_name")
    .eq("is_transferrable", false);

  if (fetchErr || !currencies) {
    console.error("Error fetching currencies:", fetchErr?.message);
    return;
  }

  const results: { oldName: string; newName: string; status: string }[] = [];

  for (const mapping of NAME_STANDARDIZATION) {
    const currency = currencies.find((c) => c.display_name === mapping.oldName);

    if (!currency) {
      results.push({
        oldName: mapping.oldName,
        newName: mapping.newName,
        status: "⚠ Not found (already renamed?)",
      });
      continue;
    }

    // Check if new name already exists (would cause conflict)
    const existingNew = currencies.find(
      (c) => c.display_name === mapping.newName
    );
    if (existingNew) {
      results.push({
        oldName: mapping.oldName,
        newName: mapping.newName,
        status: "⚠ New name already exists",
      });
      continue;
    }

    // Update the currency name
    const { error: updateErr } = await supabase
      .from("reward_currencies")
      .update({ display_name: mapping.newName })
      .eq("id", currency.id);

    if (updateErr) {
      results.push({
        oldName: mapping.oldName,
        newName: mapping.newName,
        status: `✗ Error: ${updateErr.message}`,
      });
    } else {
      results.push({
        oldName: mapping.oldName,
        newName: mapping.newName,
        status: "✓ Renamed",
      });
    }
  }

  // Print results
  console.log(
    "Old Name".padEnd(30) + " | " + "New Name".padEnd(28) + " | Status"
  );
  console.log("-".repeat(85));

  for (const r of results) {
    console.log(
      `${r.oldName.padEnd(30)} | ${r.newName.padEnd(28)} | ${r.status}`
    );
  }

  // Summary
  const renamed = results.filter((r) => r.status.startsWith("✓")).length;
  const notFound = results.filter((r) => r.status.includes("Not found")).length;
  const errors = results.filter((r) => r.status.startsWith("✗")).length;

  console.log(`\n=== Summary ===`);
  console.log(`✓ Renamed: ${renamed}`);
  console.log(`⚠ Not found: ${notFound}`);
  console.log(`✗ Errors: ${errors}`);

  // List final currencies
  const { data: final } = await supabase
    .from("reward_currencies")
    .select("display_name, issuer")
    .eq("is_transferrable", false)
    .order("display_name");

  console.log(`\n=== Final Currency Names (${final?.length}) ===`);
  final?.forEach((c) => console.log(`  ${c.display_name} (${c.issuer})`));
}

standardizeCurrencies().catch(console.error);
