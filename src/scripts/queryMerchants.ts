/**
 * Query merchants for standardization
 * Run with: npx tsx src/scripts/queryMerchants.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
}

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Query all transit-related merchants
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, address, mcc_code, is_online, is_deleted")
    .or("mcc_code.eq.4111,mcc_code.eq.4121,name.ilike.%presto%,name.ilike.%compass%,name.ilike.%transit%,name.ilike.%lyft%,name.ilike.%uber%")
    .order("name");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Transit/Ride Share merchants:", data.length);
  console.log("");

  // Group by name pattern
  const groups: Record<string, typeof data> = {};
  for (const m of data) {
    const baseName = m.name.split(" ")[0].toLowerCase();
    if (!groups[baseName]) groups[baseName] = [];
    groups[baseName].push(m);
  }

  for (const [group, merchants] of Object.entries(groups)) {
    console.log(`=== ${group.toUpperCase()} (${merchants.length}) ===`);
    for (const m of merchants) {
      const deleted = m.is_deleted ? " [DELETED]" : "";
      console.log(`  ${m.name}${deleted} | MCC: ${m.mcc_code || "N/A"} | ID: ${m.id.substring(0, 8)}...`);
    }
    console.log("");
  }
}

main();
