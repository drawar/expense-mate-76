/**
 * Enrich two merchants that had no location info:
 *   - Cafeclub → Cafe Club, 1018 W Georgia St, Vancouver
 *   - Pho Quynh Express → Phở Quỳnh, 323 Phạm Ngũ Lão, HCMC
 *
 * Coordinates verified via OSM/Nominatim restaurant/cafe nodes.
 * Merchant names left unchanged (receipts/statements read that way).
 *
 * Run with: npx tsx src/scripts/enrichCafeclubAndPhoQuynh.ts
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

const gmaps = (q: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const ENRICHMENTS = [
  {
    id: "b106d550-70f1-4ac9-914b-12abd7bc45bb",
    label: "Cafeclub",
    update: {
      address: "1018 W Georgia St, Vancouver, BC V6E 3M5",
      display_location: "Downtown, Vancouver",
      coordinates: { lat: 49.2846946, lng: -123.121891 },
      google_maps_url: gmaps("Cafe Club, 1018 W Georgia St, Vancouver, BC"),
    },
  },
  {
    id: "0ab1e01b-398e-45fb-9a06-1930c1ba88c1",
    label: "Pho Quynh Express",
    update: {
      address: "323 Phạm Ngũ Lão, District 1, Ho Chi Minh City 71009, Vietnam",
      display_location: "District 1, Ho Chi Minh City",
      coordinates: { lat: 10.767459, lng: 106.6906714 },
      google_maps_url: gmaps("Pho Quynh, 323 Pham Ngu Lao, Ho Chi Minh City"),
    },
  },
];

async function main() {
  for (const e of ENRICHMENTS) {
    const { data: before, error: rErr } = await supabase
      .from("merchants")
      .select("id, name, address, display_location, coordinates")
      .eq("id", e.id)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!before) {
      console.warn(`! ${e.label} (${e.id}) not found — skipping`);
      continue;
    }
    console.log(`Before "${before.name}":`, {
      address: before.address,
      display_location: before.display_location,
      coordinates: before.coordinates,
    });

    const { error: uErr } = await supabase
      .from("merchants")
      .update(e.update)
      .eq("id", e.id);
    if (uErr) throw uErr;

    const { data: after } = await supabase
      .from("merchants")
      .select(
        "id, name, address, display_location, coordinates, google_maps_url"
      )
      .eq("id", e.id)
      .single();
    console.log(`After  "${after!.name}":`, JSON.stringify(after, null, 2));
    console.log();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
