/**
 * Reclassify Body Energy Club from MCC 5411 (Grocery Stores) to MCC 5499
 * (Miscellaneous Food Stores). BEC is a smoothie/juice bar/supplement shop,
 * not a grocery store; 5499 is the accurate category. Both MCCs earn 5x on
 * Amex Cobalt so points math is unaffected.
 *
 * Only touches the merchant row. Historical transaction MCC codes are left
 * as Amex coded them on the statement (5411 for BEC charges), since those
 * reflect the actual per-charge coding at the time of the transaction.
 *
 * Run with: npx tsx src/scripts/fixBodyEnergyClubMcc.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (match) envVars[match[1]] = match[2];
}

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

const BEC_MERCHANT_ID = "8ae7c322-3368-4bdd-94ab-fe4744991c04";
const NEW_MCC = { code: "5499", description: "Miscellaneous Food Stores" };

async function main() {
  const { data: before, error: readErr } = await supabase
    .from("merchants")
    .select("id, name, mcc")
    .eq("id", BEC_MERCHANT_ID)
    .single();
  if (readErr) throw readErr;
  console.log("BEFORE:", JSON.stringify(before, null, 2));

  const { error: updateErr } = await supabase
    .from("merchants")
    .update({ mcc: NEW_MCC })
    .eq("id", BEC_MERCHANT_ID);
  if (updateErr) throw updateErr;

  const { data: after, error: verifyErr } = await supabase
    .from("merchants")
    .select("id, name, mcc")
    .eq("id", BEC_MERCHANT_ID)
    .single();
  if (verifyErr) throw verifyErr;
  console.log("AFTER: ", JSON.stringify(after, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
