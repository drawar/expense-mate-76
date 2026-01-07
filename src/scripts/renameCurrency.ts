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
  const { error } = await supabase.from("reward_currencies").insert({
    code: "marriott_bonvoy_dest",
    display_name: "Marriott Bonvoy Points",
    issuer: "Marriott",
    is_transferrable: false,
  });

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("✓ Added Marriott Bonvoy Points (destination)");
  }
}

main();
