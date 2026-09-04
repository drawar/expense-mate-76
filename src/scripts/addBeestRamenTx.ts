/**
 * Insert a Beest Ramen dining transaction on 2026-09-03 for CAD $21.49
 * on Amex Cobalt. MCC 5812 → 5x MR (Cobalt Dining & Grocery tier).
 *
 * Rounding: round-half-away-from-zero per Cobalt statement convention.
 *   total = round(21.49 × 5) = round(107.45) = 107
 *   base  = round(21.49)     = 21
 *   bonus = 107 − 21         = 86
 *
 * Run with: npx tsx src/scripts/addBeestRamenTx.ts
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

const USER_ID = "e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91";
const COBALT_PM = "a0c0608d-2009-49cc-976d-d9381a436dd2";
const BEEST_MERCHANT = "3c815b18-5247-4993-ab01-0e490addc2cd";

function pointRound(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

async function main() {
  const amount = 21.49;
  const total = pointRound(amount * 5);
  const base = pointRound(amount);
  const bonus = total - base;

  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: "2026-09-03",
    merchant_id: BEEST_MERCHANT,
    amount,
    currency: "CAD",
    payment_method_id: COBALT_PM,
    payment_amount: amount,
    payment_currency: "CAD",
    total_points: total,
    base_points: base,
    bonus_points: bonus,
    mcc_code: "5812",
    is_contactless: false,
    user_category: "Dining Out",
    notes: "Beest Ramen (West End, Vancouver)",
  });
  if (error) throw error;

  const { data: after, error: verifyErr } = await supabase
    .from("transactions")
    .select(
      "id, date, amount, currency, mcc_code, total_points, base_points, bonus_points, user_category, notes"
    )
    .eq("id", id)
    .single();
  if (verifyErr) throw verifyErr;
  console.log(`Created transaction → ${id}`);
  console.log(JSON.stringify(after, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
