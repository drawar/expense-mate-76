/**
 * Script to verify the fix_direct_miles_cards migration
 */

import { createClient } from "@supabase/supabase-js";

// Create a Supabase client for Node.js (no localStorage)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
  console.error(
    "Run with: source .env && npx tsx src/scripts/checkMigration.ts"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMigration() {
  console.log("=== Checking Migration Results ===\n");

  // Get all non-transferrable currencies
  const { data: currencies, error: currError } = await supabase
    .from("reward_currencies")
    .select("id, display_name, code")
    .eq("is_transferrable", false);

  if (currError) {
    console.error("Error fetching currencies:", currError.message);
    return;
  }

  console.log(
    "Non-transferrable currencies:",
    currencies?.map((c) => c.display_name)
  );

  // Check conversion rates where source = target (identity rates)
  const { data: rates, error: ratesError } = await supabase
    .from("conversion_rates")
    .select("reward_currency_id, target_currency_id, conversion_rate");

  if (ratesError) {
    console.error("Error fetching rates:", ratesError.message);
    return;
  }

  const identityRates =
    rates?.filter((r) => r.reward_currency_id === r.target_currency_id) || [];
  console.log("\nIdentity rates count:", identityRates.length);

  // Map identity rates to currency names
  if (currencies && identityRates.length > 0) {
    console.log("Identity rates:");
    for (const rate of identityRates) {
      const currency = currencies.find((c) => c.id === rate.reward_currency_id);
      if (currency) {
        console.log(`  - ${currency.display_name}: ${rate.conversion_rate}`);
      }
    }
  }

  // Check payment methods
  const { data: pms, error: pmsError } = await supabase
    .from("payment_methods")
    .select("name, points_currency, reward_currency_id")
    .order("name");

  if (pmsError) {
    console.error("Error fetching payment methods:", pmsError.message);
    return;
  }

  console.log("\nPayment methods:");
  pms?.forEach((pm) => {
    const hasRewardId = pm.reward_currency_id ? "✓" : "✗";
    console.log(
      `  ${hasRewardId} ${pm.name} | ${pm.points_currency || "N/A"} | ${pm.reward_currency_id?.substring(0, 8) || "null"}`
    );
  });

  // Check specifically for the problem cards
  console.log("\n=== Problem Cards Check ===");
  const problemCards = pms?.filter(
    (pm) =>
      pm.name?.toLowerCase().includes("brim") ||
      pm.name?.toLowerCase().includes("neo") ||
      pm.name?.toLowerCase().includes("aeroplan")
  );

  if (problemCards && problemCards.length > 0) {
    console.log("Found problem cards:");
    for (const card of problemCards) {
      console.log(
        `  - ${card.name}: reward_currency_id = ${card.reward_currency_id || "NULL"}`
      );
    }
  } else {
    console.log("No problem cards found in database");
  }
}

checkMigration().catch(console.error);
