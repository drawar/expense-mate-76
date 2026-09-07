/**
 * Re-snapshot every active + in-grace budget_periods row for a user using
 * the current budget_allocations. Wired into setAllocations.onSuccess so a
 * mid-period allocation change immediately updates the dashboard; historical
 * (already-ended) periods stay frozen as designed.
 *
 * "Active" here is the same filter useActiveBudgetPeriod uses:
 *   period_end >= today - 3 grace days
 *
 * Never throws — errors are logged and swallowed so a failed recompute
 * doesn't block the allocation save from completing.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, formatISO } from "date-fns";

import { computeBudgetPeriod } from "./computeBudgetPeriod";
import {
  DEFAULT_ALLOCATIONS,
  DEFAULT_SAVINGS_PCT,
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type ParentCategoryId,
} from "./defaults";

const GRACE_DAYS = 3;

async function loadAllocationsFor(
  supabase: SupabaseClient,
  userId: string
): Promise<{
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

export async function recomputeActivePeriods(
  supabase: SupabaseClient,
  userId: string
): Promise<{ recomputed: number }> {
  try {
    const cutoff = formatISO(addDays(new Date(), -GRACE_DAYS), {
      representation: "date",
    });
    const { data: periods, error } = await supabase
      .from("budget_periods")
      .select(
        "id, income_id, currency, period_start, period_end, salary_amount"
      )
      .eq("user_id", userId)
      .gte("period_end", cutoff);
    if (error) throw error;
    if (!periods || periods.length === 0) return { recomputed: 0 };

    const { allocations, savingsPct } = await loadAllocationsFor(
      supabase,
      userId
    );

    let recomputed = 0;
    for (const p of periods) {
      const { data: incomeData, error: iErr } = await supabase
        .from("recurring_income")
        .select("id, frequency, start_date, amount, currency")
        .eq("id", p.income_id)
        .maybeSingle();
      if (iErr || !incomeData || !incomeData.start_date) continue;

      const payload = computeBudgetPeriod(
        {
          id: incomeData.id,
          startDate: incomeData.start_date,
          amount: Number(incomeData.amount),
          currency: incomeData.currency as never,
          frequency: incomeData.frequency as never,
        },
        allocations,
        savingsPct
      );

      const { error: uErr } = await supabase.from("budget_periods").upsert(
        {
          user_id: userId,
          income_id: payload.income_id,
          currency: payload.currency,
          period_start: payload.period_start,
          period_end: payload.period_end,
          salary_amount: payload.salary_amount,
          allocations: payload.allocations,
        },
        { onConflict: "user_id,income_id" }
      );
      if (!uErr) recomputed++;
    }
    return { recomputed };
  } catch (err) {
    console.error("[recomputeActivePeriods] failed:", err);
    return { recomputed: 0 };
  }
}
