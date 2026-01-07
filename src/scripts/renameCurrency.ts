/**
 * Quick script to rename a currency
 * Usage: npx tsx src/scripts/renameCurrency.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

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

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function main() {
  // Update payment_methods with "Flying Blue Points" to "Flying Blue Miles"
  const { data, error } = await supabase
    .from("payment_methods")
    .update({ points_currency: "Flying Blue Miles" })
    .eq("points_currency", "Flying Blue Points")
    .select("id, name, points_currency");

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Updated payment methods:");
    data?.forEach((m) => console.log(`  ✓ ${m.name} → ${m.points_currency}`));
    if (data?.length === 0) {
      console.log("  No payment methods found with 'Flying Blue Points'");
    }
  }
}

main();
