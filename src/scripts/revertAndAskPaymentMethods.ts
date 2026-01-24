/**
 * Revert all payment methods back to single user, then list them for manual assignment
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

// The 7 payment methods that need to be assigned
const PAYMENT_METHODS_TO_ASK = [
  "a3ae521d-72ba-4019-afe4-dd19b749fdd1", // Cathay World Elite Mastercard (Neo Financial)
  "29d2bfac-6116-4c13-ae0a-57b4fc4f0d08", // Rewards Visa Signature (Citi)
  "4ce46e6f-4d6a-41f5-9ecc-1ba25b556eda", // Platinum (American Express)
  "eee547db-2649-491c-82f8-dd1f8494c470", // Cathay World Elite Mastercard (Neo Financial)
  "d7c8b577-ce6a-4355-9402-c3a1ae432d53", // Aeroplan Reserve (American Express)
  "a0c0608d-2009-49cc-976d-d9381a436dd2", // Cobalt (American Express)
  "ba9bc402-18aa-44b9-9b5a-a733808a3472", // Rewards Visa Signature (Citi)
];

const MAIN_USER_ID = "e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91";

async function main() {
  // First, revert all back to main user
  console.log("Reverting all 7 payment methods back to main user...\n");

  const { error: revertError } = await supabase
    .from("payment_methods")
    .update({ user_id: MAIN_USER_ID })
    .in("id", PAYMENT_METHODS_TO_ASK);

  if (revertError) {
    console.error("Error reverting:", revertError);
    return;
  }

  console.log("✅ Reverted all 7 payment methods\n");

  // Now list all payment methods with their details
  console.log("=".repeat(70));
  console.log("PAYMENT METHODS TO ASSIGN");
  console.log("=".repeat(70));

  const { data: pms } = await supabase
    .from("payment_methods")
    .select("id, name, issuer, created_at")
    .in("id", PAYMENT_METHODS_TO_ASK)
    .order("created_at");

  console.log("\nUsers:");
  console.log("  [1] arioputr@gmail.com (a533a06e-b483-4baf-a8c5-365edde3ba34)");
  console.log("  [2] vincelhvan@gmail.com (de4ceea4-51c3-4ee6-b0df-6066b284e45b)");
  console.log("  [3] van.lehoang32@gmail.com (e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91)");

  console.log("\nPayment methods to assign:\n");

  let i = 1;
  for (const pm of pms || []) {
    console.log(`[${i}] ${pm.name} (${pm.issuer})`);
    console.log(`    ID: ${pm.id}`);
    console.log(`    Created: ${pm.created_at}`);
    console.log("");
    i++;
  }
}

main();
