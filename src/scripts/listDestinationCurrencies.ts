/**
 * Script to list all destination currencies
 * Usage: npx tsx src/scripts/listDestinationCurrencies.ts
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

async function main() {
  const { data } = await supabase
    .from("reward_currencies")
    .select("id, display_name, issuer")
    .eq("is_transferrable", false)
    .order("display_name");

  console.log("Current destination currencies:\n");
  data?.forEach((c) => console.log(`${c.display_name} | ${c.issuer}`));
  console.log(`\nTotal: ${data?.length}`);
}

main().catch(console.error);
