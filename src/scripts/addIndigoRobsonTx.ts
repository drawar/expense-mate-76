/**
 * Create Indigo (Robson) merchant + insert a CAD $31.50 bookstore
 * transaction on 2026-09-09, paid with Citi Rewards Visa Signature
 * (payment_amount = 29.58 SGD after FX).
 *
 * Merchant name follows the no-paren-suffix convention: bare "Indigo",
 * differentiated from the existing Metrotown Indigo by address/coords.
 *
 * Points math per Citi Rewards 10X rule (CardRegistry.ts:305-445):
 *   10X requires (online AND non-travel) OR MCC in the offline
 *   department-store list [5311, 5611, 5621, 5631, 5641, 5651, 5655,
 *   5661, 5691, 5699, 5948]. Offline bookstore MCC 5942 matches neither
 *   branch → base 1x only, calculated on the SGD payment amount per the
 *   convertedAmount rule in CLAUDE.md:
 *     base  = floor(29.58) = 29
 *     bonus = 0
 *     total = 29
 *
 * Run with: npx tsx src/scripts/addIndigoRobsonTx.ts
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
const CITI_REWARDS_PM = "ba9bc402-18aa-44b9-9b5a-a733808a3472";

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const MERCHANT = {
  name: "Indigo",
  address: "1033 Robson St, Vancouver, BC V6E 1A9",
  display_location: "West End, Vancouver",
  mcc: { code: "5942", description: "Book Stores" },
  is_online: false,
  coordinates: { lat: 49.2840399, lng: -123.123561 },
  google_maps_url: gmaps("Indigo, 1033 Robson St, Vancouver, BC"),
};

async function ensureMerchant(): Promise<string> {
  // Use (name, address) as the uniqueness key — bare-name matches may
  // return multiple rows for the same chain at different branches.
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name, address")
    .eq("name", MERCHANT.name)
    .eq("address", MERCHANT.address)
    .maybeSingle();
  if (existing) {
    console.log(
      `Reusing merchant: ${existing.name} @ ${existing.address} → ${existing.id}`
    );
    return existing.id;
  }
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("merchants")
    .insert({ id, ...MERCHANT });
  if (error) throw error;
  console.log(
    `Created merchant: ${MERCHANT.name} @ ${MERCHANT.address} → ${id}`
  );
  return id;
}

async function main() {
  const merchantId = await ensureMerchant();

  const amount = 31.5; // CAD
  const paymentAmount = 29.58; // SGD (post-FX)
  const base = Math.floor(paymentAmount); // 29
  const bonus = 0; // Offline bookstore doesn't hit Citi Rewards 10X tier
  const total = base + bonus;

  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: "2026-09-09",
    merchant_id: merchantId,
    amount,
    currency: "CAD",
    payment_method_id: CITI_REWARDS_PM,
    payment_amount: paymentAmount,
    payment_currency: "SGD",
    total_points: total,
    base_points: base,
    bonus_points: bonus,
    mcc_code: "5942",
    is_contactless: false,
    user_category: "Hobbies & Recreation",
    notes: "Indigo (Robson St, Vancouver) — flagship bookstore",
  });
  if (error) throw error;

  const { data: after, error: vErr } = await supabase
    .from("transactions")
    .select(
      "id, date, amount, currency, payment_amount, payment_currency, mcc_code, total_points, base_points, bonus_points, user_category, notes"
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
