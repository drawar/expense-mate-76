/**
 * Apply the MCC 7299 description fix to the live DB.
 * Mirrors 20260817100000_fix_mcc_7299_description.sql.
 *
 * Run with: npx tsx src/scripts/applyMcc7299Fix.ts
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

async function main() {
  const { data: before } = await supabase
    .from("mcc")
    .select("code, description")
    .eq("code", "7299")
    .single();
  console.log(`Before: 7299 → "${before?.description}"`);

  const { error } = await supabase
    .from("mcc")
    .update({ description: "Miscellaneous Personal Services" })
    .eq("code", "7299");
  if (error) throw error;

  const { data: after } = await supabase
    .from("mcc")
    .select("code, description")
    .eq("code", "7299")
    .single();
  console.log(`After:  7299 → "${after?.description}"`);
}

main();
