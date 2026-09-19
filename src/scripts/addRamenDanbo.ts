/**
 * Insert Ramen Danbo (Robson St, Vancouver) into the merchants table.
 *
 * Location: 1833 Robson St, Vancouver, BC V6G 1E2 (West End). Tonkotsu
 * ramen chain — Vancouver flagship. Coordinates approximate via lookup.
 *
 * Idempotent: skips if a merchant with a matching name already exists.
 *
 * Run with: npx tsx src/scripts/addRamenDanbo.ts
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
  name: "Ramen Danbo",
  address: "1833 Robson St, Vancouver, BC V6G 1E2",
  display_location: "West End, Vancouver",
  mcc: { code: "5812", description: "Eating Places, Restaurants" },
  is_online: false,
  coordinates: { lat: 49.2917, lng: -123.137 },
  google_maps_url: gmaps("Ramen Danbo, 1833 Robson St, Vancouver, BC"),
};

async function main() {
  const { data: existing, error: readErr } = await supabase
    .from("merchants")
    .select("id, name, address")
    .ilike("name", MERCHANT.name)
    .limit(1);
  if (readErr) throw readErr;
  if (existing && existing.length > 0) {
    console.log(
      `Merchant already exists: ${existing[0].name} → ${existing[0].id}`
    );
    return;
  }

  const id = crypto.randomUUID();
  const { error: insertErr } = await supabase
    .from("merchants")
    .insert({ id, ...MERCHANT });
  if (insertErr) throw insertErr;
  console.log(`Created merchant: ${MERCHANT.name} → ${id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
