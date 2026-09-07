/**
 * Reclassify Cartier transactions to "Hobbies & Recreation".
 *
 * Cartier is a jewelry / luxury goods brand — no dedicated Jewelry
 * subcategory exists in the canonical set, and the current classifier
 * lands it under Personal Care (Beauty & Personal Care by default),
 * where a $9.4k one-off distorts the whole category. Hobbies &
 * Recreation (Lifestyle parent) is the closest fit for a big-ticket
 * personal collector piece.
 *
 * Run with: npx tsx src/scripts/recategorizeCartier.ts
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

const NEW_CATEGORY = "Hobbies & Recreation";

async function main() {
  const { data: merchants, error: mErr } = await supabase
    .from("merchants")
    .select("id, name")
    .ilike("name", "cartier");
  if (mErr) throw mErr;
  if (!merchants || merchants.length === 0) {
    console.log("No Cartier merchant found.");
    return;
  }

  const merchantIds = merchants.map((m) => m.id);
  console.log(
    `Found ${merchants.length} Cartier merchant(s):`,
    merchants.map((m) => `${m.name} (${m.id})`).join(", ")
  );

  const { data: before, error: rErr } = await supabase
    .from("transactions")
    .select("id, date, amount, user_category")
    .in("merchant_id", merchantIds)
    .order("date");
  if (rErr) throw rErr;
  const rows = before ?? [];
  console.log(`\nFound ${rows.length} Cartier transactions.`);
  const breakdown = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.user_category ?? "(null)";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  console.log("Before:", breakdown);

  const toUpdate = rows.filter((r) => r.user_category !== NEW_CATEGORY);
  if (toUpdate.length === 0) {
    console.log(
      "Nothing to update — all rows already on Hobbies & Recreation."
    );
    return;
  }

  const { error: uErr } = await supabase
    .from("transactions")
    .update({ user_category: NEW_CATEGORY })
    .in("merchant_id", merchantIds);
  if (uErr) throw uErr;

  const { data: after, error: aErr } = await supabase
    .from("transactions")
    .select("user_category")
    .in("merchant_id", merchantIds);
  if (aErr) throw aErr;
  const afterBreakdown = (after ?? []).reduce<Record<string, number>>(
    (acc, r) => {
      const k = r.user_category ?? "(null)";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    },
    {}
  );
  console.log(`Updated ${toUpdate.length} rows.`);
  console.log("After: ", afterBreakdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
