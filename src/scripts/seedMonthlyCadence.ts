/**
 * One-off: promote existing budget_allocations rows for Essentials +
 * Home & Living to cadence='monthly' so lumpy monthly bills (rent,
 * mortgage, utilities, car loan, insurance) sit against a monthly
 * budget instead of blowing up a single pay period.
 *
 * Migration 20260917120000 added cadence with DEFAULT 'per_period', so
 * existing rows landed on per_period regardless of DEFAULT_CADENCE
 * client-side. This one-shot brings them in line. Any user who prefers
 * per_period on these categories can flip them back in Settings.
 *
 * Idempotent — only updates rows currently at 'per_period'.
 *
 * Run with: npx tsx src/scripts/seedMonthlyCadence.ts
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

const MONTHLY_DEFAULTS = ["essentials", "home_living"] as const;

async function main() {
  const { data: before, error: rErr } = await supabase
    .from("budget_allocations")
    .select("id, user_id, parent_category_id, percentage, cadence")
    .in("parent_category_id", MONTHLY_DEFAULTS as unknown as string[]);
  if (rErr) throw rErr;
  console.log(
    `Found ${before?.length ?? 0} rows for monthly-default categories.`
  );
  const toUpdate = (before ?? []).filter((r) => r.cadence !== "monthly");
  console.log(`${toUpdate.length} rows need cadence flipped to 'monthly'.`);

  if (toUpdate.length === 0) return;

  for (const row of toUpdate) {
    const { error } = await supabase
      .from("budget_allocations")
      .update({ cadence: "monthly" })
      .eq("id", row.id);
    if (error) {
      console.warn(`! failed to update ${row.id}:`, error.message);
      continue;
    }
    console.log(
      `✓ user ${row.user_id} · ${row.parent_category_id} · pct ${row.percentage} → monthly`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
