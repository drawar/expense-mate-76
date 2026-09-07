/**
 * Create Fortune Katsu (Metrotown) merchant + insert a $27.77 CAD dining
 * transaction on 2026-09-02, paid with RBC ION+ Visa.
 *
 * Address and coordinates verified via OpenStreetMap / Nominatim (restaurant
 * node "Fortune Katsu" at 4386 Beresford St, Burnaby, BC).
 *
 * Points math per RBC ION+ Visa Dining tier (3x on restaurants MCC 5812):
 *   base  = floor(27.77)       = 27
 *   bonus = floor(27.77 * 2)   = 55
 *   total                       = 82
 *
 * Run with: npx tsx src/scripts/addFortuneKatsuTx.ts
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
  name: "Fortune Katsu (Metrotown)",
  address: "4386 Beresford St, Burnaby, BC V5H 2Y4",
  display_location: "Metrotown, Burnaby",
  mcc: { code: "5812", description: "Eating Places, Restaurants" },
  is_online: false,
  coordinates: { lat: 49.2261715, lng: -123.0059101 },
  google_maps_url: gmaps("Fortune Katsu, 4386 Beresford St, Burnaby, BC"),
};

async function ensureMerchant(): Promise<string> {
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name")
    .ilike("name", MERCHANT.name)
    .limit(1);
  if (existing && existing.length > 0) {
    console.log(`Reusing merchant: ${existing[0].name} → ${existing[0].id}`);
    return existing[0].id;
  }
  const id = crypto.randomUUID();
  const { error } = await supabase
    .from("merchants")
    .insert({ id, ...MERCHANT });
  if (error) throw error;
  console.log(`Created merchant: ${MERCHANT.name} → ${id}`);
  return id;
}

async function main() {
  const merchantId = await ensureMerchant();

  const amount = 27.77;
  const base = Math.floor(amount); // 27
  const bonus = Math.floor(amount * 2); // 55
  const total = base + bonus; // 82

  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: "2026-09-02",
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
    notes: "Fortune Katsu (Metrotown, Burnaby)",
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
