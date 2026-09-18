/**
 * One-off: flip `financial_other` cadence from per_period → monthly so
 * that Financial Services / Subscriptions / Insurance / etc. accumulate
 * on the calendar month rather than a single pay-period window.
 *
 * Prompted by: monthly loan repayments (Citi personal loan, ~$865/mo)
 * live under Financial Services but fell outside the active pay period
 * and were invisible to the budget card.
 *
 * Idempotent — no-op if the row already says 'monthly'.
 *
 * Run with: npx tsx src/scripts/flipFinancialOtherToMonthly.ts
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

async function main() {
  const { data: rows, error: rErr } = await supabase
    .from("budget_allocations")
    .select("id, user_id, parent_category_id, percentage, cadence")
    .eq("parent_category_id", "financial_other");
  if (rErr) throw rErr;

  const toUpdate = (rows ?? []).filter((r) => r.cadence !== "monthly");
  console.log(
    `Found ${rows?.length ?? 0} financial_other rows, ${toUpdate.length} need flipping to monthly.`
  );

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
      `✓ user ${row.user_id} · financial_other · pct ${row.percentage} → monthly`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
