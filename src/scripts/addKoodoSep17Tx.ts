/**
 * Insert Koodo Mobile CAD $22.04 on Amex Aeroplan Reserve, 2026-09-17.
 *
 * Card earns 3x on Air Canada / 1.25x on everything else per prior
 * import scripts. Koodo (MCC 4814 Telecoms) is the 1.25x tier, rounded
 * half-away-from-zero:
 *   base  = round(22.04)         = 22
 *   total = round(22.04 * 1.25)  = 28
 *   bonus = total − base         = 6
 *
 * Run with: npx tsx src/scripts/addKoodoSep17Tx.ts
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
const AEROPLAN_RESERVE_PM = "d7c8b577-ce6a-4355-9402-c3a1ae432d53";
const KOODO_MERCHANT = "73d7c55f-df2b-4928-92ac-12dcfa170961";

function pointRound(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

async function main() {
  const amount = 22.04;
  const base = pointRound(amount); // 22
  const total = pointRound(amount * 1.25); // 28
  const bonus = total - base; // 6

  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: "2026-09-17",
    merchant_id: KOODO_MERCHANT,
    amount,
    currency: "CAD",
    payment_method_id: AEROPLAN_RESERVE_PM,
    payment_amount: amount,
    payment_currency: "CAD",
    total_points: total,
    base_points: base,
    bonus_points: bonus,
    mcc_code: "4814",
    is_contactless: false,
    user_category: "Utilities",
    notes: "Koodo Mobile monthly bill",
  });
  if (error) throw error;

  const { data: after } = await supabase
    .from("transactions")
    .select(
      "id, date, amount, currency, mcc_code, total_points, base_points, bonus_points, user_category, notes"
    )
    .eq("id", id)
    .single();
  console.log(`Created transaction → ${id}`);
  console.log(JSON.stringify(after, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
