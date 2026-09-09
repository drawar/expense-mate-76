/**
 * Rename "Din Tai Fung (Alberni)" → "Din Tai Fung". Address/display_location
 * already carry the branch info — the name doesn't need a paren suffix.
 *
 * Run with: npx tsx src/scripts/renameDinTaiFungAlberni.ts
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

const MERCHANT_ID = "b2b19262-4489-47e7-910d-4b9610b941d2";

async function main() {
  const { data: before, error: rErr } = await supabase
    .from("merchants")
    .select("id, name, address, display_location")
    .eq("id", MERCHANT_ID)
    .single();
  if (rErr) throw rErr;
  console.log("Before:", JSON.stringify(before, null, 2));

  const { error: uErr } = await supabase
    .from("merchants")
    .update({ name: "Din Tai Fung" })
    .eq("id", MERCHANT_ID);
  if (uErr) throw uErr;

  const { data: after, error: aErr } = await supabase
    .from("merchants")
    .select("id, name, address, display_location")
    .eq("id", MERCHANT_ID)
    .single();
  if (aErr) throw aErr;
  console.log("After: ", JSON.stringify(after, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
