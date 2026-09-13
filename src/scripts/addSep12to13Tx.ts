/**
 * Three transactions on Amex Cobalt:
 *   Sep 12 · CHICHA San Chen (Metrotown, new merchant) · CAD $7.30
 *   Sep 12 · Good Earth Coffeehouse (existing Robson row)  · CAD $11.27
 *   Sep 13 · Uber Eats (existing row)                      · CAD $55.32
 *
 * All qualify for Cobalt 5x — CHICHA + Good Earth at MCC 5814 (Fast Food)
 * on the Dining & Grocery tier, Uber Eats at MCC 5499 on the Food Delivery
 * tier. Round-half-away-from-zero per Cobalt statement convention.
 *
 * Run with: npx tsx src/scripts/addSep12to13Tx.ts
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
const GOOD_EARTH_ID = "8aa2f14b-5c6a-452f-aaaf-75dfd76c4483";
const UBER_EATS_ID = "e7353ee6-26e3-462a-be98-612d14601669";

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

function pointRound(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

const CHICHA_METROTOWN = {
  name: "CHICHA San Chen",
  address: "4501 Kingsway, Burnaby, BC V5H 2A9",
  display_location: "Metrotown, Burnaby",
  mcc: { code: "5814", description: "Fast Food Restaurants" },
  is_online: false,
  coordinates: { lat: 49.2304185, lng: -123.004184 },
  google_maps_url: gmaps("Chicha San Chen, 4501 Kingsway, Burnaby, BC"),
};

async function ensureChichaMetrotown(): Promise<string> {
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name, address")
    .eq("name", CHICHA_METROTOWN.name)
    .eq("address", CHICHA_METROTOWN.address)
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
    .insert({ id, ...CHICHA_METROTOWN });
  if (error) throw error;
  console.log(
    `Created: ${CHICHA_METROTOWN.name} @ ${CHICHA_METROTOWN.address} → ${id}`
  );
  return id;
}

interface Tx {
  date: string;
  merchant_id: string;
  merchant_name: string;
  amount: number;
  mcc_code: string;
  user_category: string;
  notes: string;
}

async function insertTx(t: Tx): Promise<void> {
  const total = pointRound(t.amount * 5);
  const base = pointRound(t.amount);
  const bonus = total - base;
  const id = crypto.randomUUID();
  const { error } = await supabase.from("transactions").insert({
    id,
    user_id: USER_ID,
    date: t.date,
    merchant_id: t.merchant_id,
    amount: t.amount,
    currency: "CAD",
    payment_method_id: COBALT_PM,
    payment_amount: t.amount,
    payment_currency: "CAD",
    total_points: total,
    base_points: base,
    bonus_points: bonus,
    mcc_code: t.mcc_code,
    is_contactless: false,
    user_category: t.user_category,
    notes: t.notes,
  });
  if (error) throw error;
  console.log(
    `✓ ${t.date}  ${t.merchant_name.padEnd(25)}  $${t.amount.toFixed(2).padStart(7)}  ${total} pts (${base}+${bonus})  → ${id}`
  );
}

async function main() {
  const chichaId = await ensureChichaMetrotown();

  await insertTx({
    date: "2026-09-12",
    merchant_id: chichaId,
    merchant_name: "CHICHA San Chen",
    amount: 7.3,
    mcc_code: "5814",
    user_category: "Fast Food & Takeout",
    notes: "CHICHA San Chen (Metrotown, Burnaby)",
  });

  await insertTx({
    date: "2026-09-12",
    merchant_id: GOOD_EARTH_ID,
    merchant_name: "Good Earth Coffeehouse",
    amount: 11.27,
    mcc_code: "5814",
    user_category: "Fast Food & Takeout",
    notes: "Good Earth Coffeehouse (Robson, Vancouver)",
  });

  await insertTx({
    date: "2026-09-13",
    merchant_id: UBER_EATS_ID,
    merchant_name: "Uber Eats",
    amount: 55.32,
    mcc_code: "5499",
    user_category: "Food Delivery",
    notes: "Uber Eats",
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
