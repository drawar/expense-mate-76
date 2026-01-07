/**
 * Script to consolidate Avios currencies
 *
 * Avios is a shared currency across BA, Iberia, Qatar, etc.
 * They should all point to a single "Avios" entry.
 *
 * Usage: npx tsx src/scripts/consolidateAvios.ts
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

// Currencies to consolidate into "Avios"
const AVIOS_DUPLICATES = ["Plus Avios", "Privilege Club Avios"];

async function consolidateAvios() {
  console.log("=== Consolidating Avios Currencies ===\n");

  // Find the main Avios currency
  const { data: aviosCurrency } = await supabase
    .from("reward_currencies")
    .select("id, display_name, issuer")
    .eq("display_name", "Avios")
    .single();

  if (!aviosCurrency) {
    console.error("Avios currency not found!");
    return;
  }

  console.log(
    `Main Avios: ${aviosCurrency.display_name} (${aviosCurrency.issuer})`
  );
  console.log(`ID: ${aviosCurrency.id}\n`);

  // Update issuer to reflect shared nature
  await supabase
    .from("reward_currencies")
    .update({ issuer: "IAG Loyalty (BA, Iberia, Qatar, etc.)" })
    .eq("id", aviosCurrency.id);
  console.log("Updated Avios issuer to reflect shared nature\n");

  for (const dupName of AVIOS_DUPLICATES) {
    const { data: dupCurrency } = await supabase
      .from("reward_currencies")
      .select("id, display_name")
      .eq("display_name", dupName)
      .single();

    if (!dupCurrency) {
      console.log(`"${dupName}" not found (already consolidated?)`);
      continue;
    }

    console.log(`Consolidating "${dupName}" (${dupCurrency.id}) into Avios...`);

    // Get conversion rates pointing to the duplicate
    const { data: ratesToDup } = await supabase
      .from("conversion_rates")
      .select("id, reward_currency_id")
      .eq("target_currency_id", dupCurrency.id);

    // Get conversion rates already pointing to Avios
    const { data: ratesToAvios } = await supabase
      .from("conversion_rates")
      .select("reward_currency_id")
      .eq("target_currency_id", aviosCurrency.id);

    const aviosSourceIds = new Set(
      ratesToAvios?.map((r) => r.reward_currency_id)
    );

    let deleted = 0;
    let updated = 0;

    for (const rate of ratesToDup || []) {
      if (aviosSourceIds.has(rate.reward_currency_id)) {
        // Source already has rate to Avios, delete duplicate
        await supabase.from("conversion_rates").delete().eq("id", rate.id);
        deleted++;
      } else {
        // Update to point to Avios
        await supabase
          .from("conversion_rates")
          .update({ target_currency_id: aviosCurrency.id })
          .eq("id", rate.id);
        updated++;
      }
    }

    console.log(`  Rates: ${updated} updated, ${deleted} deleted (duplicates)`);

    // Delete any rates where duplicate is the source
    await supabase
      .from("conversion_rates")
      .delete()
      .eq("reward_currency_id", dupCurrency.id);

    // Delete the duplicate currency
    const { error: delErr } = await supabase
      .from("reward_currencies")
      .delete()
      .eq("id", dupCurrency.id);

    if (delErr) {
      console.log(`  Error deleting: ${delErr.message}`);
    } else {
      console.log(`  ✓ Deleted "${dupName}"`);
    }
  }

  // Final count
  const { data: final } = await supabase
    .from("reward_currencies")
    .select("display_name")
    .eq("is_transferrable", false)
    .order("display_name");

  console.log(`\n=== Final: ${final?.length} destination currencies ===`);
}

consolidateAvios().catch(console.error);
