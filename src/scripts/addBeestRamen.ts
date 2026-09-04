/**
 * Insert Beest Ramen (Vancouver West End) into the merchants table.
 *
 * Address, neighborhood, and coordinates verified via OpenStreetMap /
 * Nominatim (restaurant node "Beest" at 770 Bute St, V6E 1C2).
 *
 * Idempotent: skips if a merchant with a matching name already exists.
 *
 * Run with: npx tsx src/scripts/addBeestRamen.ts
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

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const MERCHANT = {
  name: "Beest Ramen",
  address: "770 Bute St, Vancouver, BC V6E 1C2",
  display_location: "West End, Vancouver",
  mcc: { code: "5812", description: "Eating Places, Restaurants" },
  is_online: false,
  coordinates: { lat: 49.2861495, lng: -123.1264961 },
  google_maps_url: gmaps("Beest Ramen, 770 Bute St, Vancouver, BC"),
};

async function main() {
  const { data: existing, error: readErr } = await supabase
    .from("merchants")
    .select("id, name, address, mcc, coordinates")
    .ilike("name", MERCHANT.name)
    .limit(1);
  if (readErr) throw readErr;
  if (existing && existing.length > 0) {
    console.log(
      `Merchant already exists: ${existing[0].name} → ${existing[0].id}`
    );
    console.log(JSON.stringify(existing[0], null, 2));
    return;
  }

  const id = crypto.randomUUID();
  const { error: insertErr } = await supabase
    .from("merchants")
    .insert({ id, ...MERCHANT });
  if (insertErr) throw insertErr;

  const { data: after, error: verifyErr } = await supabase
    .from("merchants")
    .select(
      "id, name, address, display_location, mcc, coordinates, google_maps_url, is_online"
    )
    .eq("id", id)
    .single();
  if (verifyErr) throw verifyErr;
  console.log(`Created merchant: ${MERCHANT.name} → ${id}`);
  console.log(JSON.stringify(after, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
