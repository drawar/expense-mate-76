/**
 * Change the active Liftoff Salary income (Aug 28, currently biweekly) to
 * semi_monthly so its budget period ends Sep 15 instead of Sep 11, matching
 * the actual paycheck schedule (mid-month + end-of-month).
 *
 * The syncBudgetPeriodForIncome trigger fires on write when the row is a
 * matching salary; recomputeActivePeriods is not automatic here because
 * we're bypassing the client hook. Runs sync inline via the same
 * computeBudgetPeriod → upsert path.
 *
 * Run with: npx tsx src/scripts/switchLiftoffToSemiMonthly.ts
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

const USER_ID = "e215b298-6ea8-44b0-b7b9-8b0b0bbaeb91";
const INCOME_ID = "9ac69fc3-d82a-472e-99e4-08d420133641"; // Aug 28 Liftoff Salary

async function main() {
  // 1. Change the income row's frequency.
  const { data: incomeBefore, error: bErr } = await supabase
    .from("recurring_income")
    .select("id, name, amount, currency, frequency, start_date")
    .eq("id", INCOME_ID)
    .maybeSingle();
  if (bErr) throw bErr;
  if (!incomeBefore) {
    console.error("Aug 28 Liftoff Salary row not found. Aborting.");
    process.exit(1);
  }
  console.log("Before:", incomeBefore);

  const { error: uErr } = await supabase
    .from("recurring_income")
    .update({ frequency: "semi_monthly" })
    .eq("id", INCOME_ID);
  if (uErr) throw uErr;

  // 2. Re-snapshot budget_periods with the new frequency.
  const { data: allocRows } = await supabase
    .from("budget_allocations")
    .select("parent_category_id, percentage")
    .eq("user_id", USER_ID);
  const allocations: Record<ParentCategoryId, number> = {
    ...DEFAULT_ALLOCATIONS,
  };
  let savingsPct = DEFAULT_SAVINGS_PCT;
  for (const row of allocRows ?? []) {
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

  const payload = computeBudgetPeriod(
    {
      id: incomeBefore.id,
      startDate: incomeBefore.start_date!,
      amount: Number(incomeBefore.amount),
      currency: incomeBefore.currency as never,
      frequency: "semi_monthly",
    },
    allocations,
    savingsPct
  );

  const { error: pErr } = await supabase.from("budget_periods").upsert(
    {
      user_id: USER_ID,
      income_id: payload.income_id,
      currency: payload.currency,
      period_start: payload.period_start,
      period_end: payload.period_end,
      salary_amount: payload.salary_amount,
      allocations: payload.allocations,
    },
    { onConflict: "user_id,income_id" }
  );
  if (pErr) throw pErr;

  const { data: incomeAfter } = await supabase
    .from("recurring_income")
    .select("id, frequency, start_date")
    .eq("id", INCOME_ID)
    .single();
  const { data: periodAfter } = await supabase
    .from("budget_periods")
    .select("period_start, period_end, salary_amount, allocations")
    .eq("income_id", INCOME_ID)
    .single();
  console.log("\nIncome after:", incomeAfter);
  console.log("Period after:", JSON.stringify(periodAfter, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
