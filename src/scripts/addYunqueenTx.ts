/**
 * Create Yunqueen Rice Noodles merchant + insert Sep 17 CAD $26.48 dining
 * transaction on RBC ION+ Visa.
 *
 * Address and coords verified via OSM/Nominatim restaurant node at
 * 1460 Robson St, Vancouver.
 *
 * Points math per RBC ION+ Visa Dining tier (3x on MCC 5812):
 *   base  = floor(26.48)       = 26
 *   bonus = floor(26.48 * 2)   = 52
 *   total                       = 78
 *
 * Run with: npx tsx src/scripts/addYunqueenTx.ts
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

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const MERCHANT = {
  name: "Yunqueen Rice Noodles",
  address: "1460 Robson St, Vancouver, BC V6G 1C1",
  display_location: "West End, Vancouver",
  mcc: { code: "5812", description: "Eating Places, Restaurants" },
  is_online: false,
  coordinates: { lat: 49.2883288, lng: -123.1309549 },
  google_maps_url: gmaps(
    "Yunqueen Rice Noodles, 1460 Robson St, Vancouver, BC"
  ),
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

  const amount = 26.48;
  const base = Math.floor(amount); // 26
  const bonus = Math.floor(amount * 2); // 52
  const total = base + bonus; // 78

  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: "2026-09-17",
    merchant_id: merchantId,
    amount,
    currency: "CAD",
    payment_method_id: ION_PLUS_PM,
    payment_amount: amount,
    payment_currency: "CAD",
    total_points: total,
    base_points: base,
    bonus_points: bonus,
    mcc_code: "5812",
    is_contactless: false,
    user_category: "Dining Out",
    notes: "Yunqueen Rice Noodles (Robson, Vancouver)",
  });
  if (error) throw error;

  const { data: after } = await supabase
    .from("transactions")
    .select(
      "id, date, amount, currency, mcc_code, total_points, base_points, bonus_points, user_category, notes"
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
