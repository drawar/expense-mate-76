/**
 * Script to clean up duplicate reward currencies
 * Run with: npx tsx src/scripts/cleanupDuplicateCurrencies.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  // First, list all reward currencies
  const { data: currencies, error: listError } = await supabase
    .from("reward_currencies")
    .select("*")
    .order("display_name");

  console.log("Raw response:", { currencies, listError });

  if (listError) {
    console.error("Error listing currencies:", listError);
    return;
  }

  console.log("Current currencies:");
  currencies?.forEach((c) =>
    console.log(`  ${c.code}: ${c.display_name} (${c.issuer})`)
  );

  // Find duplicates to remove
  // citi_thankyou should be removed (keep citibank_thankyou)
  // amex_mr_ca_2 should be removed (keep amex_mr_ca)
  const citiThankyou = currencies?.find((c) => c.code === "citi_thankyou");
  const amexMrCa2 = currencies?.find((c) => c.code === "amex_mr_ca_2");

  console.log("\nDuplicates to remove:");
  if (citiThankyou) console.log("  - citi_thankyou:", citiThankyou.id);
  else console.log("  - citi_thankyou: not found");
  if (amexMrCa2) console.log("  - amex_mr_ca_2:", amexMrCa2.id);
  else console.log("  - amex_mr_ca_2: not found");

  // Delete duplicates
  if (citiThankyou) {
    const { error } = await supabase
      .from("reward_currencies")
      .delete()
      .eq("id", citiThankyou.id);
    if (error) console.error("Error deleting citi_thankyou:", error);
    else console.log("✅ Deleted citi_thankyou");
  }

  if (amexMrCa2) {
    const { error } = await supabase
      .from("reward_currencies")
      .delete()
      .eq("id", amexMrCa2.id);
    if (error) console.error("Error deleting amex_mr_ca_2:", error);
    else console.log("✅ Deleted amex_mr_ca_2");
  }

  // List remaining currencies
  const { data: remaining } = await supabase
    .from("reward_currencies")
    .select("code, display_name")
    .order("display_name");

  console.log("\nRemaining currencies:");
  remaining?.forEach((c) => console.log(`  ${c.code}: ${c.display_name}`));

  console.log("\n✅ Cleanup complete!");
}

cleanup();
