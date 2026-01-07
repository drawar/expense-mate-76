/**
 * Script to seed HSBC Rewards Points transfer partners
 *
 * Based on official HSBC Singapore transfer partner list (as of Jan 2025)
 *
 * Transfer Ratios (HSBC Points : Miles):
 * - 50,000 : 10,000 = 0.20 rate (JAL)
 * - 35,000 : 10,000 = 0.2857 rate (Aeroplan, Fortune Wings, Qatar, Turkish, United)
 * - 30,000 : 10,000 = 0.3333 rate (Thai, KrisFlyer)
 * - 25,000 : 10,000 = 0.40 rate (Flying Blue, Avios, Asia Miles, Etihad, EVA, Qantas, Vietnam)
 *
 * Usage: npx tsx src/scripts/seedHSBCTransferPartners.ts
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
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  console.error("Make sure .env file exists with these variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Missing destination currencies that need to be created
const MISSING_DESTINATION_CURRENCIES = [
  {
    code: "jal_mileage_bank",
    display_name: "JAL Mileage Bank",
    issuer: "Japan Airlines",
  },
  {
    code: "fortune_wings_club",
    display_name: "Fortune Wings Club",
    issuer: "Hainan Airlines",
  },
  {
    code: "miles_and_smiles",
    display_name: "Miles&Smiles",
    issuer: "Turkish Airlines",
  },
  {
    code: "royal_orchid_plus",
    display_name: "Royal Orchid Plus",
    issuer: "Thai Airways",
  },
  {
    code: "infinity_mileagelands",
    display_name: "Infinity MileageLands",
    issuer: "EVA Air",
  },
  {
    code: "lotusmiles",
    display_name: "LotuSmiles",
    issuer: "Vietnam Airlines",
  },
];

// HSBC transfer partners with their conversion rates
// Rate = 10000 / (HSBC points required for 10,000 miles)
const HSBC_TRANSFER_PARTNERS: {
  name: string;
  dbName: string; // Name as it appears in reward_currencies table
  hsbcPointsRequired: number; // Points needed for 10,000 miles
  rate: number;
}[] = [
  // 50,000 : 10,000 ratio (0.20)
  {
    name: "JAL Mileage Bank",
    dbName: "JAL Mileage Bank",
    hsbcPointsRequired: 50000,
    rate: 0.2,
  },

  // 35,000 : 10,000 ratio (0.2857)
  {
    name: "Aeroplan",
    dbName: "Aeroplan",
    hsbcPointsRequired: 35000,
    rate: 10000 / 35000, // ~0.2857
  },
  {
    name: "Fortune Wings Club",
    dbName: "Fortune Wings Club",
    hsbcPointsRequired: 35000,
    rate: 10000 / 35000,
  },
  {
    name: "Qatar Privilege Club",
    dbName: "Qatar Privilege Club",
    hsbcPointsRequired: 35000,
    rate: 10000 / 35000,
  },
  {
    name: "Turkish Miles&Smiles",
    dbName: "Miles&Smiles",
    hsbcPointsRequired: 35000,
    rate: 10000 / 35000,
  },
  {
    name: "United MileagePlus",
    dbName: "United MileagePlus",
    hsbcPointsRequired: 35000,
    rate: 10000 / 35000,
  },

  // 30,000 : 10,000 ratio (0.3333)
  {
    name: "Thai Royal Orchid Plus",
    dbName: "Royal Orchid Plus",
    hsbcPointsRequired: 30000,
    rate: 10000 / 30000, // ~0.3333
  },
  {
    name: "KrisFlyer",
    dbName: "KrisFlyer",
    hsbcPointsRequired: 30000, // Changed from 25,000 on Jan 16, 2025
    rate: 10000 / 30000,
  },

  // 25,000 : 10,000 ratio (0.40)
  {
    name: "Flying Blue",
    dbName: "Flying Blue Miles",
    hsbcPointsRequired: 25000,
    rate: 0.4,
  },
  {
    name: "British Airways Avios",
    dbName: "Avios",
    hsbcPointsRequired: 25000,
    rate: 0.4,
  },
  {
    name: "Asia Miles",
    dbName: "Asia Miles",
    hsbcPointsRequired: 25000,
    rate: 0.4,
  },
  {
    name: "Etihad Guest",
    dbName: "Etihad Guest",
    hsbcPointsRequired: 25000,
    rate: 0.4,
  },
  {
    name: "EVA Infinity MileageLands",
    dbName: "Infinity MileageLands",
    hsbcPointsRequired: 25000,
    rate: 0.4,
  },
  {
    name: "Qantas Frequent Flyer",
    dbName: "Qantas Frequent Flyer",
    hsbcPointsRequired: 25000,
    rate: 0.4,
  },
  {
    name: "Vietnam LotuSmiles",
    dbName: "LotuSmiles",
    hsbcPointsRequired: 25000,
    rate: 0.4,
  },
];

async function seedHSBCTransferPartners() {
  console.log("=== Seeding HSBC Rewards Transfer Partners ===\n");

  // 0. Create missing destination currencies first
  console.log("Creating missing destination currencies...");
  for (const currency of MISSING_DESTINATION_CURRENCIES) {
    // Check if exists
    const { data: existing } = await supabase
      .from("reward_currencies")
      .select("id")
      .eq("display_name", currency.display_name)
      .maybeSingle();

    if (existing) {
      console.log(`  - ${currency.display_name}: already exists`);
      continue;
    }

    // Create currency
    const { error } = await supabase.from("reward_currencies").insert({
      code: currency.code,
      display_name: currency.display_name,
      issuer: currency.issuer,
      is_transferrable: false, // Destination currencies are not transferrable
    });

    if (error) {
      console.log(`  - ${currency.display_name}: ✗ Error: ${error.message}`);
    } else {
      console.log(`  - ${currency.display_name}: ✓ Created`);
    }
  }
  console.log("");

  // 1. Find HSBC Rewards Points currency
  console.log("Looking up HSBC Rewards Points currency...");
  const hsbcResult = await supabase
    .from("reward_currencies")
    .select("id, display_name, code")
    .eq("is_transferrable", true)
    .or("display_name.ilike.%HSBC%,code.ilike.%HSBC%")
    .single();

  let hsbcCurrency = hsbcResult.data;

  if (hsbcResult.error || !hsbcCurrency) {
    console.error("Error finding HSBC currency:", hsbcResult.error?.message);
    console.log("\nAttempting to create HSBC Rewards Points currency...");

    const { data: newCurrency, error: createError } = await supabase
      .from("reward_currencies")
      .insert({
        code: "HSBC_REWARDS",
        display_name: "HSBC Rewards Points",
        issuer: "HSBC",
        is_transferrable: true,
      })
      .select()
      .single();

    if (createError || !newCurrency) {
      console.error("Failed to create HSBC currency:", createError?.message);
      return;
    }
    console.log("✓ Created HSBC Rewards Points currency");
    hsbcCurrency = newCurrency;
  }

  const hsbcCurrencyId = hsbcCurrency.id;
  console.log(
    `✓ Found HSBC currency: ${hsbcCurrency.display_name} (${hsbcCurrencyId})\n`
  );

  // 2. Get all destination currencies
  console.log("Looking up destination currencies...");
  const { data: destinations, error: destError } = await supabase
    .from("reward_currencies")
    .select("id, display_name, code")
    .eq("is_transferrable", false);

  if (destError || !destinations) {
    console.error("Error fetching destination currencies:", destError?.message);
    return;
  }

  console.log(`Found ${destinations.length} destination currencies\n`);

  // 3. Create conversion rates
  const results: { partner: string; status: string; rate?: number }[] = [];
  const missingCurrencies: string[] = [];

  for (const partner of HSBC_TRANSFER_PARTNERS) {
    // Find the destination currency (case-insensitive match)
    const destCurrency = destinations.find(
      (d) =>
        d.display_name.toLowerCase() === partner.dbName.toLowerCase() ||
        d.code.toLowerCase() === partner.dbName.toLowerCase()
    );

    if (!destCurrency) {
      missingCurrencies.push(partner.dbName);
      results.push({
        partner: partner.name,
        status: `⚠ Currency not found: ${partner.dbName}`,
      });
      continue;
    }

    // Check if rate already exists
    const { data: existingRate } = await supabase
      .from("conversion_rates")
      .select("id")
      .eq("reward_currency_id", hsbcCurrencyId)
      .eq("target_currency_id", destCurrency.id)
      .maybeSingle();

    let error: Error | null = null;

    if (existingRate) {
      // Update existing rate
      const { error: updateError } = await supabase
        .from("conversion_rates")
        .update({ conversion_rate: partner.rate })
        .eq("id", existingRate.id);
      error = updateError;
    } else {
      // Insert new rate
      const { error: insertError } = await supabase
        .from("conversion_rates")
        .insert({
          reward_currency_id: hsbcCurrencyId,
          target_currency_id: destCurrency.id,
          conversion_rate: partner.rate,
        });
      error = insertError;
    }

    if (error) {
      results.push({
        partner: partner.name,
        status: `✗ Error: ${error.message}`,
      });
    } else {
      results.push({
        partner: partner.name,
        status: existingRate ? "✓ Updated" : "✓ Created",
        rate: partner.rate,
      });
    }
  }

  // Print results
  console.log("=== Results ===\n");
  console.log(
    "Partner                          | Status                    | Rate"
  );
  console.log("-".repeat(75));

  for (const result of results) {
    const rateStr = result.rate ? result.rate.toFixed(4) : "-";
    console.log(
      `${result.partner.padEnd(32)} | ${result.status.padEnd(25)} | ${rateStr}`
    );
  }

  // Summary
  const successful = results.filter((r) => r.status.startsWith("✓")).length;
  const failed = results.filter((r) => r.status.startsWith("✗")).length;
  const notFound = results.filter((r) => r.status.startsWith("⚠")).length;

  console.log(`\n=== Summary ===`);
  console.log(`✓ Successful: ${successful}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`⚠ Currency not found: ${notFound}`);

  if (missingCurrencies.length > 0) {
    console.log(`\nMissing currencies that need to be created:`);
    missingCurrencies.forEach((c) => console.log(`  - ${c}`));
    console.log(
      "\nYou can add these currencies in the Settings > Conversion Rates UI"
    );
  }

  console.log("\n=== Done ===");
}

seedHSBCTransferPartners().catch(console.error);
