/**
 * Batch rename: strip redundant "(branch)" paren suffix from 19 chain
 * merchants where the branch info is already carried by
 * address / display_location. Ends up with two or more merchants sharing
 * the bare brand name; that's expected — the UI differentiates them by
 * display_location.
 *
 * Chexy (Broadview / Enerpro / BC Hydro / Trong Dong Nguyen), Ryan Beatty
 * (Concert), OVpay (Amsterdam Transit), STM (Montreal Transit), Wander
 * Kitchen & Bar (YYC), and Amaze (Instarem) are LEFT ALONE — their parens
 * carry semantic info (different payee, event context, service context)
 * that address can't encode.
 *
 * Idempotent — safe to re-run; if the row already has the target name,
 * skip. Run with: npx tsx src/scripts/batchRenameMerchants.ts
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

const RENAMES: Array<{ from: string; to: string }> = [
  { from: "Din Tai Fung (Taipei 101)", to: "Din Tai Fung" },
  { from: "Horin Ramen (Crystal Mall)", to: "Horin Ramen" },
  { from: "Horin Ramen (Robson)", to: "Horin Ramen" },
  { from: "Nemesis Coffee (Gastown)", to: "Nemesis Coffee" },
  { from: "Nemesis Coffee (Great Northern Way)", to: "Nemesis Coffee" },
  { from: "Trees Organic Coffee (450 Granville)", to: "Trees Organic Coffee" },
  { from: "Abercrombie & Fitch (Pacific Centre)", to: "Abercrombie & Fitch" },
  { from: "Honolulu Coffee (Olympic Village)", to: "Honolulu Coffee" },
  { from: "Good Earth Coffeehouse (Robson)", to: "Good Earth Coffeehouse" },
  { from: "Bisou Bakehouse (Robson)", to: "Bisou Bakehouse" },
  { from: "Ryu ADM (YUL Airport)", to: "Ryu ADM" },
  { from: "49th Parallel Coffee (Montréal)", to: "49th Parallel Coffee" },
  { from: "Rexall Pharmacy #7163 (Station Square)", to: "Rexall Pharmacy" },
  { from: "FamilyMart Taiwan (Zhongshan)", to: "FamilyMart Taiwan" },
  { from: "Wanke Shabu (Taichung Guo'an)", to: "Wanke Shabu" },
  { from: "VVG Village (National Taichung Theater)", to: "VVG Village" },
  { from: "CHICHA San Chen (Taichung Flagship)", to: "CHICHA San Chen" },
  { from: "Shingen Shabu (Da'an)", to: "Shingen Shabu" },
  { from: "Fortune Katsu (Metrotown)", to: "Fortune Katsu" },
];

async function main() {
  let renamed = 0;
  let skipped = 0;
  let missing = 0;

  for (const { from, to } of RENAMES) {
    const { data, error } = await supabase
      .from("merchants")
      .select("id, name, display_location")
      .eq("name", from)
      .maybeSingle();
    if (error) {
      console.warn(`! query failed for "${from}":`, error.message);
      continue;
    }
    if (!data) {
      console.log(`— not found: "${from}"`);
      missing++;
      continue;
    }
    if (data.name === to) {
      console.log(`= already renamed: "${to}" (${data.id})`);
      skipped++;
      continue;
    }
    const { error: uErr } = await supabase
      .from("merchants")
      .update({ name: to })
      .eq("id", data.id);
    if (uErr) {
      console.warn(`! rename failed for "${from}":`, uErr.message);
      continue;
    }
    console.log(`✓ "${from}"  →  "${to}"   [${data.display_location ?? "—"}]`);
    renamed++;
  }

  console.log(
    `\nRenamed ${renamed}, skipped ${skipped}, not-found ${missing} of ${RENAMES.length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
