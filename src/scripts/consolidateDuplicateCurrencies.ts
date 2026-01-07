/**
 * Script to consolidate duplicate destination currencies
 *
 * Duplicates identified:
 * - Royal Orchid Plus / Thai Royal Orchid Plus (Thai Airways)
 * - Infinity MileageLands / EVA Infinity MileageLands (EVA Air)
 * - Miles&Smiles / Turkish Miles&Smiles (Turkish Airlines)
 * - LotuSmiles / Vietnam Airlines Lotusmiles (Vietnam Airlines)
 *
 * Usage: npx tsx src/scripts/consolidateDuplicateCurrencies.ts
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

// Duplicates: [keep name, delete name]
const DUPLICATE_PAIRS = [
  { keep: "Royal Orchid Plus", del: "Thai Royal Orchid Plus" },
  { keep: "Infinity MileageLands", del: "EVA Infinity MileageLands" },
  { keep: "Miles&Smiles", del: "Turkish Miles&Smiles" },
  { keep: "LotuSmiles", del: "Vietnam Airlines Lotusmiles" },
];

async function consolidate() {
  console.log("=== Consolidating Duplicate Destination Currencies ===\n");

  // Get all destination currencies
  const { data: currencies, error: fetchErr } = await supabase
    .from("reward_currencies")
    .select("id, display_name")
    .eq("is_transferrable", false);

  if (fetchErr || !currencies) {
    console.error("Error fetching currencies:", fetchErr?.message);
    return;
  }

  for (const pair of DUPLICATE_PAIRS) {
    const keepCurrency = currencies.find((c) => c.display_name === pair.keep);
    const delCurrency = currencies.find((c) => c.display_name === pair.del);

    if (!delCurrency) {
      console.log(`Skip: "${pair.del}" not found (already deleted?)`);
      continue;
    }

    if (!keepCurrency) {
      console.log(`Skip: "${pair.keep}" not found`);
      continue;
    }

    console.log(`\nConsolidating: "${pair.del}" -> "${pair.keep}"`);
    console.log(`  Keep ID: ${keepCurrency.id}`);
    console.log(`  Delete ID: ${delCurrency.id}`);

    // 1. Get all rates pointing to the duplicate currency
    const { data: ratesToDel } = await supabase
      .from("conversion_rates")
      .select("id, reward_currency_id")
      .eq("target_currency_id", delCurrency.id);

    // 2. Get all rates pointing to the keep currency
    const { data: ratesToKeep } = await supabase
      .from("conversion_rates")
      .select("reward_currency_id")
      .eq("target_currency_id", keepCurrency.id);

    const keepSourceIds = new Set(
      ratesToKeep?.map((r) => r.reward_currency_id)
    );

    // 3. For rates pointing to duplicate: delete if source already has rate to keep, otherwise update
    let deleted = 0;
    let updated = 0;

    for (const rate of ratesToDel || []) {
      if (keepSourceIds.has(rate.reward_currency_id)) {
        // Source already has rate to keep currency, delete this duplicate rate
        await supabase.from("conversion_rates").delete().eq("id", rate.id);
        deleted++;
      } else {
        // Update to point to keep currency
        await supabase
          .from("conversion_rates")
          .update({ target_currency_id: keepCurrency.id })
          .eq("id", rate.id);
        updated++;
      }
    }

    console.log(
      `  Deleted ${deleted} duplicate rates, updated ${updated} rates`
    );

    // 4. Delete any rates where the duplicate is the source (identity rates)
    const { error: deleteSourceErr } = await supabase
      .from("conversion_rates")
      .delete()
      .eq("reward_currency_id", delCurrency.id);

    if (deleteSourceErr) {
      console.log(`  Error deleting source rates: ${deleteSourceErr.message}`);
    }

    // 5. Delete the duplicate currency
    const { error: deleteErr } = await supabase
      .from("reward_currencies")
      .delete()
      .eq("id", delCurrency.id);

    if (deleteErr) {
      console.log(`  Error deleting currency: ${deleteErr.message}`);
    } else {
      console.log(`  ✓ Deleted duplicate currency`);
    }
  }

  // Verify final count
  const { data: final } = await supabase
    .from("reward_currencies")
    .select("id, display_name")
    .eq("is_transferrable", false)
    .order("display_name");

  console.log(`\n=== Final: ${final?.length} destination currencies ===`);
  final?.forEach((c) => console.log(`  - ${c.display_name}`));
}

consolidate().catch(console.error);
