/**
 * Create Grains Fish Noodle (Crystal Mall, Burnaby) merchant and insert
 * Sep 18 CAD $16.25 dining transaction, paid via Amaze + Citi Rewards
 * **Mastercard** (SGD 15.19).
 *
 * IMPORTANT: uses the Citi Rewards *World Mastercard* (Citi issuer, SGD),
 * NOT the Citi Rewards Visa Signature. Prior scripts defaulted to the Visa
 * PM by mistake — see user feedback 2026-09-19.
 *
 * Points calc: Amaze reroutes to Citi as AMAZE.SG (typically MCC 6540) in
 * SGD, so Citi's 10X rules don't fire reliably. Conservative 1x on the
 * SGD payment amount (CLAUDE.md convertedAmount rule):
 *   base  = floor(15.19) = 15
 *   bonus = 0
 *   total = 15
 * Adjust if the Citi statement ends up crediting 10X.
 *
 * Run with: npx tsx src/scripts/addGrainsFishNoodleTx.ts
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
// Citi Rewards *World Mastercard* — NOT the Visa Signature.
const CITI_REWARDS_MC = "605c94ab-1792-48c1-91ad-d1a67663d29a";

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const MERCHANT = {
  name: "Grains Fish Noodle",
  address: "4500 Kingsway, Burnaby, BC V5H 2A9",
  display_location: "Crystal Mall, Burnaby",
  mcc: { code: "5812", description: "Eating Places, Restaurants" },
  is_online: false,
  coordinates: { lat: 49.2244, lng: -122.9986 },
  google_maps_url: gmaps("Grains Fish Noodle, Crystal Mall, Burnaby, BC"),
};

async function ensureMerchant(): Promise<string> {
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name, address")
    .eq("name", MERCHANT.name)
    .eq("address", MERCHANT.address)
    .maybeSingle();
  if (existing) {
    console.log(
      `Reusing: ${existing.name} @ ${existing.address} → ${existing.id}`
    );
    return existing.id;
  }
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("merchants")
    .insert({ id, ...MERCHANT });
  if (error) throw error;
  console.log(`Created: ${MERCHANT.name} @ ${MERCHANT.address} → ${id}`);
  return id;
}

async function main() {
  const merchantId = await ensureMerchant();

  const amount = 16.25; // CAD
  const paymentAmount = 15.19; // SGD via Amaze
  const base = Math.floor(paymentAmount); // 15
  const bonus = 0;
  const total = base + bonus;

  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: "2026-09-18",
    merchant_id: merchantId,
    amount,
    currency: "CAD",
    payment_method_id: CITI_REWARDS_MC,
    payment_amount: paymentAmount,
    payment_currency: "SGD",
    total_points: total,
    base_points: base,
    bonus_points: bonus,
    mcc_code: "5812",
    is_contactless: false,
    user_category: "Dining Out",
    notes:
      "Grains Fish Noodle (Crystal Mall, Burnaby) — via Amaze on Citi Rewards MC",
  });
  if (error) throw error;

  console.log(
    `Created transaction → ${id}  |  CAD ${amount} → SGD ${paymentAmount}  |  ${total} pts (Citi Rewards MC conservative 1x)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
