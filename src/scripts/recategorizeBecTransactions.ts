/**
 * Recategorize all Body Energy Club transactions to "Gym & Fitness".
 *
 * BEC is a smoothie/supplement shop inside Equinox — belongs in the same
 * bucket as gym membership spend, not Groceries.
 *
 * Run with: npx tsx src/scripts/recategorizeBecTransactions.ts
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

const BEC_MERCHANT_ID = "8ae7c322-3368-4bdd-94ab-fe4744991c04";
const NEW_CATEGORY = "Gym & Fitness";

async function main() {
  const { data: before, error: readErr } = await supabase
    .from("transactions")
    .select("id, date, amount, user_category")
    .eq("merchant_id", BEC_MERCHANT_ID)
    .order("date");
  if (readErr) throw readErr;

  const rows = before ?? [];
  console.log(`Found ${rows.length} BEC transactions.`);
  const breakdown = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.user_category ?? "(null)";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  console.log("Before:", breakdown);

  const toUpdate = rows.filter((r) => r.user_category !== NEW_CATEGORY);
  if (toUpdate.length === 0) {
    console.log("Nothing to update — all rows already on Gym & Fitness.");
    return;
  }

  const { error: updateErr } = await supabase
    .from("transactions")
    .update({ user_category: NEW_CATEGORY })
    .eq("merchant_id", BEC_MERCHANT_ID);
  if (updateErr) throw updateErr;

  const { data: after, error: verifyErr } = await supabase
    .from("transactions")
    .select("user_category")
    .eq("merchant_id", BEC_MERCHANT_ID);
  if (verifyErr) throw verifyErr;
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
