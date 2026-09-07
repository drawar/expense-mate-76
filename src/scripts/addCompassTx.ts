/**
 * Insert three Compass (Vancouver transit) transactions on RBC ION+ Visa:
 *   - 2 × 2026-09-07 · CAD $6.70
 *   - 1 × 2026-09-06 · CAD $6.70
 *
 * MCC 4111 (local commuter transport) — in RBC ION+'s 3x tier, so each
 * $6.70 fare earns:
 *   base  = floor(6.70)      = 6
 *   bonus = floor(6.70 × 2)  = 13
 *   total                     = 19
 *
 * Run with: npx tsx src/scripts/addCompassTx.ts
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

async function main() {
  const { data: compass, error: mErr } = await supabase
    .from("merchants")
    .select("id, name, mcc")
    .ilike("name", "compass")
    .limit(1)
    .maybeSingle();
  if (mErr) throw mErr;
  if (!compass) {
    console.error("No Compass merchant found. Aborting.");
    process.exit(1);
  }
  console.log(`Using merchant: ${compass.name} → ${compass.id}`);
  console.log(`  Stored MCC: ${JSON.stringify(compass.mcc)}`);

  const amount = 6.7;
  const base = Math.floor(amount); // 6
  const bonus = Math.floor(amount * 2); // 13
  const total = base + bonus; // 19

  const dates = ["2026-09-07", "2026-09-07", "2026-09-06"];

  for (const date of dates) {
    const id = crypto.randomUUID();
    const { error } = await supabase.from("transactions").insert({
      id,
      user_id: USER_ID,
      date,
      merchant_id: compass.id,
      amount,
      currency: "CAD",
      payment_method_id: ION_PLUS_PM,
      payment_amount: amount,
      payment_currency: "CAD",
      total_points: total,
      base_points: base,
      bonus_points: bonus,
      mcc_code: "4111",
      is_contactless: true,
      user_category: "Transportation",
      notes: "Compass transit fare (Vancouver)",
    });
    if (error) {
      console.error(`✗ ${date}:`, error.message);
      continue;
    }
    console.log(
      `✓ ${date}  $${amount.toFixed(2)}  ${total} pts (${base}+${bonus})  → ${id}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
