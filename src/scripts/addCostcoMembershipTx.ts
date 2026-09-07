/**
 * Insert Costco membership renewal — $68.25 CAD on 2026-09-03, paid with
 * RBC ION+ Visa. Uses the existing Costco merchant row.
 *
 * Costco is a warehouse club (MCC 5300) and does not fall in RBC ION+
 * Visa's 3x tier (grocery / restaurants / rideshare / transit), so this
 * earns 1x:
 *   base  = floor(68.25) = 68
 *   bonus = 0
 *   total = 68
 *
 * Category: Subscriptions & Memberships (Financial & Other parent).
 *
 * Run with: npx tsx src/scripts/addCostcoMembershipTx.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

const envPath = join(process.cwd(), ".env");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^=]+)="?([^"]*)"?$/);
  if (m) envVars[m[1]] = m[2];
}
const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = "e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91";
const ION_PLUS_PM = "5cb1d8fb-b9dc-4700-901f-b19639284a5b";

async function findCostco(): Promise<{
  id: string;
  name: string;
  mcc: unknown;
} | null> {
  const { data, error } = await supabase
    .from("merchants")
    .select("id, name, mcc")
    .ilike("name", "costco")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function main() {
  const costco = await findCostco();
  if (!costco) {
    console.error("No Costco merchant found. Aborting.");
    process.exit(1);
  }
  console.log(`Using merchant: ${costco.name} → ${costco.id}`);
  console.log(`  Stored MCC: ${JSON.stringify(costco.mcc)}`);

  const amount = 68.25;
  const base = Math.floor(amount); // 68
  const bonus = 0; // Costco (MCC 5300) not in ION+ 3x tier
  const total = base + bonus; // 68

  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: "2026-09-03",
    merchant_id: costco.id,
    amount,
    currency: "CAD",
    payment_method_id: ION_PLUS_PM,
    payment_amount: amount,
    payment_currency: "CAD",
    total_points: total,
    base_points: base,
    bonus_points: bonus,
    mcc_code: "5300",
    is_contactless: false,
    user_category: "Subscriptions & Memberships",
    notes: "Costco Gold Star membership renewal",
  });
  if (error) throw error;

  const { data: after, error: vErr } = await supabase
    .from("transactions")
    .select(
      "id, date, amount, currency, mcc_code, total_points, base_points, bonus_points, user_category, notes"
    )
    .eq("id", id)
    .single();
  if (vErr) throw vErr;
  console.log(`\nCreated transaction → ${id}`);
  console.log(JSON.stringify(after, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
