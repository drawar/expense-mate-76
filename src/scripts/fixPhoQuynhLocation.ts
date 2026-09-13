/**
 * Correct Pho Quynh Express to its actual Vancouver location. My earlier
 * enrichment wrongly assumed HCMC — the CAD transaction currency and the
 * "Express" branding both point to the Vancouver Burrard St outpost, and
 * OSM confirms an exact restaurant node at 810 Burrard St.
 *
 * Run with: npx tsx src/scripts/fixPhoQuynhLocation.ts
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

const MERCHANT_ID = "0ab1e01b-398e-45fb-9a06-1930c1ba88c1";

async function main() {
  const { data: before, error: rErr } = await supabase
    .from("merchants")
    .select("id, name, address, display_location, coordinates")
    .eq("id", MERCHANT_ID)
    .single();
  if (rErr) throw rErr;
  console.log("Before:", JSON.stringify(before, null, 2));

  const { error: uErr } = await supabase
    .from("merchants")
    .update({
      address: "810 Burrard St, Vancouver, BC V6Z 1X8",
      display_location: "Downtown, Vancouver",
      coordinates: { lat: 49.2828897, lng: -123.1230681 },
      google_maps_url: gmaps(
        "Pho Quynh Express, 810 Burrard St, Vancouver, BC"
      ),
    })
    .eq("id", MERCHANT_ID);
  if (uErr) throw uErr;

  const { data: after } = await supabase
    .from("merchants")
    .select("id, name, address, display_location, coordinates, google_maps_url")
    .eq("id", MERCHANT_ID)
    .single();
  console.log("After: ", JSON.stringify(after, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
