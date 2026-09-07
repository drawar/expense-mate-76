/**
 * One-off: re-snapshot every existing budget_periods row with the current
 * budget_allocations (spending %s + savings %). Necessary the first time
 * savings is rolled out so users don't need to wait for their next salary
 * to see the "Save first" section on the dashboard.
 *
 * Uses the same computeBudgetPeriod pure function as the client trigger,
 * so post-recompute rows are byte-identical to what a fresh salary save
 * would produce today. Safe to re-run — upserts by (user_id, income_id)
 * via the UNIQUE constraint.
 *
 * Run with: npx tsx src/scripts/recomputeBudgetPeriods.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

import { computeBudgetPeriod } from "@/utils/budget/computeBudgetPeriod";
import {
  DEFAULT_ALLOCATIONS,
  DEFAULT_SAVINGS_PCT,
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type ParentCategoryId,
} from "@/utils/budget/defaults";

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

interface PeriodRow {
  id: string;
  user_id: string;
  income_id: string;
  currency: string;
  period_start: string;
  period_end: string;
  salary_amount: number;
  allocations: Record<string, number>;
}

interface IncomeRow {
  id: string;
  user_id: string;
  frequency: string;
  start_date: string | null;
  amount: number;
  currency: string;
}

async function loadAllocationsFor(userId: string): Promise<{
  allocations: Record<ParentCategoryId, number>;
  savingsPct: number;
}> {
  const { data, error } = await supabase
    .from("budget_allocations")
    .select("parent_category_id, percentage")
    .eq("user_id", userId);
  if (error) throw error;
  const allocations: Record<ParentCategoryId, number> = {
    ...DEFAULT_ALLOCATIONS,
  };
  let savingsPct = DEFAULT_SAVINGS_PCT;
  for (const row of data ?? []) {
    if (row.parent_category_id === SAVINGS_ID) {
      savingsPct = Number(row.percentage);
    } else if (
      (PARENT_CATEGORY_IDS as readonly string[]).includes(
        row.parent_category_id
      )
    ) {
      allocations[row.parent_category_id as ParentCategoryId] = Number(
        row.percentage
      );
    }
  }
  return { allocations, savingsPct };
}

async function main() {
  const { data: periods, error: pErr } = await supabase
    .from("budget_periods")
    .select("*");
  if (pErr) throw pErr;

  const rows = (periods ?? []) as PeriodRow[];
  console.log(`Found ${rows.length} budget_periods rows to recompute.\n`);

  let updated = 0;
  for (const p of rows) {
    const { data: incomeData, error: iErr } = await supabase
      .from("recurring_income")
      .select("id, user_id, frequency, start_date, amount, currency")
      .eq("id", p.income_id)
      .maybeSingle();
    if (iErr) {
      console.warn(`  ! income ${p.income_id} lookup failed:`, iErr.message);
      continue;
    }
    const inc = incomeData as IncomeRow | null;
    if (!inc || !inc.start_date) {
      console.warn(`  ! income ${p.income_id} missing or has no start_date`);
      continue;
    }

    const { allocations, savingsPct } = await loadAllocationsFor(p.user_id);
    const payload = computeBudgetPeriod(
      {
        id: inc.id,
        startDate: inc.start_date,
        amount: Number(inc.amount),
        currency: inc.currency as never,
        frequency: inc.frequency as never,
      },
      allocations,
      savingsPct
    );

    const { error: uErr } = await supabase.from("budget_periods").upsert(
      {
        user_id: p.user_id,
        income_id: payload.income_id,
        currency: payload.currency,
        period_start: payload.period_start,
        period_end: payload.period_end,
        salary_amount: payload.salary_amount,
        allocations: payload.allocations,
      },
      { onConflict: "user_id,income_id" }
    );
    if (uErr) {
      console.warn(
        `  ! upsert for income ${p.income_id} failed:`,
        uErr.message
      );
      continue;
    }
    updated++;
    console.log(
      `  ✓ ${p.period_start} → ${payload.period_end}  savings=${payload.allocations[SAVINGS_ID]}`
    );
  }

  console.log(`\nRecomputed ${updated}/${rows.length} rows.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
