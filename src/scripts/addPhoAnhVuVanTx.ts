/**
 * Create Pho Anh Vu (Vancouver Kingsway) merchant + insert Sep 14 CAD $26.99
 * dining transaction paid via Amaze + Citi Rewards Visa Signature; SGD
 * payment_amount = 25.32.
 *
 * Existing "Pho Anh Vu" in the DB is the Toronto row (577 Yonge St). Bare
 * "Pho Anh Vu" name here per naming convention — differentiated from
 * Toronto by address. OSM confirms restaurant node at 2155 Kingsway.
 *
 * Points calc: Amaze reroutes the merchant to Citi's statement as
 * something like AMAZE.SG (usually MCC 6540) in SGD. Citi Rewards 10X
 * requires either online+eligible-MCC or offline+department-store MCC —
 * neither fires reliably through Amaze, so we log the conservative base
 * 1x on the SGD payment amount per CLAUDE.md's convertedAmount rule:
 *   base  = floor(25.32) = 25
 *   bonus = 0
 *   total = 25
 * If your Citi statement ends up crediting 10X, adjust manually.
 *
 * Run with: npx tsx src/scripts/addPhoAnhVuVanTx.ts
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
  name: "Pho Anh Vu",
  address: "2155 Kingsway, Vancouver, BC V5N 2T4",
  display_location: "Kensington-Cedar Cottage, Vancouver",
  mcc: { code: "5812", description: "Eating Places, Restaurants" },
  is_online: false,
  coordinates: { lat: 49.2441071, lng: -123.062516 },
  google_maps_url: gmaps("Pho Anh Vu, 2155 Kingsway, Vancouver, BC"),
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

  const amount = 26.99; // CAD
  const paymentAmount = 25.32; // SGD via Amaze
  const base = Math.floor(paymentAmount); // 25
  const bonus = 0;
  const total = base + bonus;

  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: "2026-09-14",
    merchant_id: merchantId,
    amount,
    currency: "CAD",
    payment_method_id: CITI_REWARDS_PM,
    payment_amount: paymentAmount,
    payment_currency: "SGD",
    total_points: total,
    base_points: base,
    bonus_points: bonus,
    mcc_code: "5812",
    is_contactless: false,
    user_category: "Dining Out",
    notes: "Pho Anh Vu (Kingsway, Vancouver) — via Amaze on Citi Rewards",
  });
  if (error) throw error;

  const { data: after } = await supabase
    .from("transactions")
    .select(
      "id, date, amount, currency, payment_amount, payment_currency, mcc_code, total_points, base_points, bonus_points, user_category, notes"
    )
    .eq("id", id)
    .single();
  console.log(`\nCreated transaction → ${id}`);
  console.log(JSON.stringify(after, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
