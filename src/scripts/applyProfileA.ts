/**
 * Apply Profile A budget allocations: aggressive 50% savings.
 *
 *   Savings           50
 *   Essentials        26
 *   Lifestyle         16
 *   Home & Living      1
 *   Personal Care      3
 *   Work & Education   0
 *   Financial & Other  4
 *   Total            100
 *
 * Upserts into budget_allocations then re-snapshots active budget_periods
 * so the current pay period reflects the new split immediately.
 *
 * Run with: npx tsx src/scripts/applyProfileA.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

import { recomputeActivePeriods } from "@/utils/budget/recomputeActivePeriods";

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

const USER_ID = "e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91";

const ALLOCATIONS: Array<{ parent_category_id: string; percentage: number }> = [
  { parent_category_id: "savings", percentage: 50 },
  { parent_category_id: "essentials", percentage: 26 },
  { parent_category_id: "lifestyle", percentage: 16 },
  { parent_category_id: "home_living", percentage: 1 },
  { parent_category_id: "personal_care", percentage: 3 },
  { parent_category_id: "work_education", percentage: 0 },
  { parent_category_id: "financial_other", percentage: 4 },
];

async function main() {
  const rows = ALLOCATIONS.map((a) => ({ user_id: USER_ID, ...a }));
  const { error } = await supabase
    .from("budget_allocations")
    .upsert(rows, { onConflict: "user_id,parent_category_id" });
  if (error) throw error;
  console.log("Wrote 7 allocation rows.");

  const { recomputed } = await recomputeActivePeriods(supabase, USER_ID);
  console.log(`Recomputed ${recomputed} active budget_periods row(s).`);

  const { data: after, error: aErr } = await supabase
    .from("budget_allocations")
    .select("parent_category_id, percentage")
    .eq("user_id", USER_ID)
    .order("parent_category_id");
  if (aErr) throw aErr;
  console.log("\nCurrent budget_allocations:");
  console.table(after);

  const { data: periods, error: pErr } = await supabase
    .from("budget_periods")
    .select("period_start, period_end, salary_amount, allocations")
    .eq("user_id", USER_ID)
    .order("period_start", { ascending: false })
    .limit(1);
  if (pErr) throw pErr;
  console.log("\nMost recent period after recompute:");
  console.log(JSON.stringify(periods, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
