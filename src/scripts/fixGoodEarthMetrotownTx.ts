/**
 * Correct the Sep 12 Good Earth Coffeehouse transaction: it was at the
 * Metrotown location (4700 Kingsway, inside Metropolis at Metrotown), not
 * the existing Robson merchant I pointed the earlier insert at.
 *
 * Creates a second "Good Earth Coffeehouse" merchant row for Metrotown
 * (bare brand name per naming convention; differentiated from Robson by
 * address), then repoints transaction fb01e27f… wait — that's Uber
 * Eats. Repoint the correct one: da54baaa-9454-4280-8499-81b68f796a02.
 *
 * Run with: npx tsx src/scripts/fixGoodEarthMetrotownTx.ts
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

const TX_ID = "da54baaa-9454-4280-8499-81b68f796a02";

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const METROTOWN_GOOD_EARTH = {
  name: "Good Earth Coffeehouse",
  address: "4700 Kingsway, Burnaby, BC V5H 2C3",
  display_location: "Metrotown, Burnaby",
  mcc: { code: "5814", description: "Fast Food Restaurants" },
  is_online: false,
  coordinates: { lat: 49.2272922, lng: -122.9993918 },
  google_maps_url: gmaps("Good Earth Coffeehouse, 4700 Kingsway, Burnaby, BC"),
};

async function ensureMerchant(): Promise<string> {
  const { data: existing } = await supabase
    .from("merchants")
    .select("id, name, address")
    .eq("name", METROTOWN_GOOD_EARTH.name)
    .eq("address", METROTOWN_GOOD_EARTH.address)
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
    .insert({ id, ...METROTOWN_GOOD_EARTH });
  if (error) throw error;
  console.log(
    `Created: ${METROTOWN_GOOD_EARTH.name} @ ${METROTOWN_GOOD_EARTH.address} → ${id}`
  );
  return id;
}

async function main() {
  const merchantId = await ensureMerchant();

  const { data: before, error: rErr } = await supabase
    .from("transactions")
    .select("id, date, amount, merchant_id, notes")
    .eq("id", TX_ID)
    .single();
  if (rErr) throw rErr;
  console.log("Before:", before);

  const { error: uErr } = await supabase
    .from("transactions")
    .update({
      merchant_id: merchantId,
      notes: "Good Earth Coffeehouse (Metrotown, Burnaby)",
    })
    .eq("id", TX_ID);
  if (uErr) throw uErr;

  const { data: after } = await supabase
    .from("transactions")
    .select("id, date, amount, merchant_id, notes")
    .eq("id", TX_ID)
    .single();
  console.log("After: ", after);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
