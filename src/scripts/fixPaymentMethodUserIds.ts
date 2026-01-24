/**
 * Check and fix payment method user_ids
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Load env file manually
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

async function main() {
  // Get all payment methods with their user_ids
  const { data: paymentMethods, error } = await supabase
    .from("payment_methods")
    .select("id, name, issuer, user_id, created_at")
    .order("created_at");

  if (error) {
    console.error("Error fetching payment methods:", error);
    return;
  }

  console.log("All payment methods in database:\n");

  // Group by user_id
  const byUserId: Record<string, any[]> = {};
  for (const pm of paymentMethods || []) {
    if (!byUserId[pm.user_id]) {
      byUserId[pm.user_id] = [];
    }
    byUserId[pm.user_id].push(pm);
  }

  for (const [userId, pms] of Object.entries(byUserId)) {
    console.log(`\nUser ID: ${userId}`);
    console.log(`  Count: ${pms.length}`);
    for (const pm of pms) {
      console.log(`    - ${pm.name} (${pm.issuer}) - created: ${pm.created_at}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));
  for (const [userId, pms] of Object.entries(byUserId)) {
    console.log(`${userId}: ${pms.length} payment methods`);
  }
}

main();
