/**
 * Create Din Tai Fung (Alberni) merchant + insert a CAD $60 dining
 * transaction on 2026-09-08 (today), paid with Amex Cobalt.
 *
 * Address, neighborhood, and coordinates verified via OSM / Nominatim
 * (restaurant node "Din Tai Fung" at 1132 Alberni St, V6E 4T9).
 *
 * Points math per Amex Cobalt 5x on Dining (MCC 5812), round-half-away:
 *   total = round(60 * 5) = 300
 *   base  = round(60)     = 60
 *   bonus = 300 − 60      = 240
 *
 * Run with: npx tsx src/scripts/addDinTaiFungVanTx.ts
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
const COBALT_PM = "a0c0608d-2009-49cc-976d-d9381a436dd2";

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const MERCHANT = {
  name: "Din Tai Fung (Alberni)",
  address: "1132 Alberni St, Vancouver, BC V6E 4T9",
  display_location: "West End, Vancouver",
  mcc: { code: "5812", description: "Eating Places, Restaurants" },
  is_online: false,
  coordinates: { lat: 49.2857327, lng: -123.1247019 },
  google_maps_url: gmaps("Din Tai Fung, 1132 Alberni St, Vancouver, BC"),
};

function pointRound(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

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

  const amount = 60;
  const total = pointRound(amount * 5);
  const base = pointRound(amount);
  const bonus = total - base;

  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: "2026-09-08",
    merchant_id: merchantId,
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
    notes: "Din Tai Fung (Alberni St, Vancouver)",
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
