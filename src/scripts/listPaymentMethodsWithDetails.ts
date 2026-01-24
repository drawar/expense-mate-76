/**
 * List payment methods with last 4 digits
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

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const PAYMENT_METHODS_TO_ASK = [
  "d7c8b577-ce6a-4355-9402-c3a1ae432d53",
  "a0c0608d-2009-49cc-976d-d9381a436dd2",
  "ba9bc402-18aa-44b9-9b5a-a733808a3472",
  "4ce46e6f-4d6a-41f5-9ecc-1ba25b556eda",
  "eee547db-2649-491c-82f8-dd1f8494c470",
  "29d2bfac-6116-4c13-ae0a-57b4fc4f0d08",
  "a3ae521d-72ba-4019-afe4-dd19b749fdd1",
];

async function main() {
  const { data: pms } = await supabase
    .from("payment_methods")
    .select("id, name, issuer, last_four_digits, created_at, currency")
    .in("id", PAYMENT_METHODS_TO_ASK)
    .order("created_at");

  console.log("Users:");
  console.log("  [1] arioputr@gmail.com");
  console.log("  [2] vincelhvan@gmail.com");
  console.log("  [3] van.lehoang32@gmail.com (you)");
  console.log("");

  let i = 1;
  for (const pm of pms || []) {
    console.log(`[${i}] ${pm.name} (${pm.issuer})`);
    console.log(`    Last 4: ${pm.last_four_digits || "N/A"}`);
    console.log(`    Currency: ${pm.currency}`);
    console.log(`    Created: ${pm.created_at}`);
    console.log(`    ID: ${pm.id}`);
    console.log("");
    i++;
  }
}

main();
