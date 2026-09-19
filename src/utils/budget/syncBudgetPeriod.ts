/**
 * Client-side "trigger" that keeps the budget_periods row for a salary income
 * in sync when the income is inserted/updated/renamed.
 *
 * Called from useRecurringIncome.saveIncome immediately after a successful
 * upsert. See the handling matrix in the pay-period budget feature plan
 * (nested-leaping-wreath.md §"Trigger logic — client-side, in saveIncome").
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Currency, RecurringIncome } from "@/types";
import { computeBudgetPeriod } from "./computeBudgetPeriod";
import {
  DEFAULT_ALLOCATIONS,
  DEFAULT_SAVINGS_PCT,
  PARENT_CATEGORY_IDS,
  SAVINGS_ID,
  type ParentCategoryId,
} from "./defaults";
import { loadPreviousSettledCarry } from "./loadPreviousSettledCarry";
import { matchesSalary } from "./matchesSalary";

interface SyncArgs {
  supabase: SupabaseClient;
  userId: string;
  displayCurrency: Currency;
  next: Omit<RecurringIncome, "createdAt" | "updatedAt">;
  prev: { name: string; currency: string } | null;
}

async function loadAllocations(
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

/**
 * Sync the budget_periods row for a just-upserted income row.
 * Never throws — errors are logged and swallowed so a failed sync does not
 * roll back the income upsert.
 */
export async function syncBudgetPeriodForIncome({
  supabase,
  userId,
  displayCurrency,
  next,
  prev,
}: SyncArgs): Promise<void> {
  try {
    // A one-off row is a single event, not a pay-period anchor — never
    // creates a budget period (and if the row was previously recurring and
    // is now one-off, the "not-a-match" cleanup below removes any prior
    // period for this income_id).
    const isRecurring = next.frequency !== "one_off";
    const nextMatches =
      isRecurring &&
      matchesSalary(next.name) &&
      next.currency === displayCurrency;
    const prevMatches =
      !!prev && matchesSalary(prev.name) && prev.currency === displayCurrency;

    // Cases (d) and (e): dropped out of "salary + right currency + recurring"
    // — clean up.
    if (!nextMatches) {
      if (prevMatches) {
        await supabase
          .from("budget_periods")
          .delete()
          .eq("user_id", userId)
          .eq("income_id", next.id);
      }
      return;
    }

    // Cases (a), (b), (c): still (or newly) a matching salary — upsert.
    if (!next.startDate) return; // guarded upstream but be safe

    // Immutability guard: if the existing row is already settled
    // (closed_at IS NOT NULL), do NOT rewrite its snapshot — that would
    // corrupt the carry_out already computed against the frozen shape.
    // A settled period can only be changed via the resettleFromDate
    // walker after an actual transaction/income edit.
    const { data: existing } = await supabase
      .from("budget_periods")
      .select("id, closed_at")
      .eq("user_id", userId)
      .eq("income_id", next.id)
      .maybeSingle();
    if (existing?.closed_at) {
      // Settled row exists — leave it frozen. resettleFromDate will
      // reconcile the chain if this income edit affects a window that
      // overlaps a settled period.
      return;
    }

    const { allocations, savingsPct } = await loadAllocations(supabase, userId);
    const carryIn = await loadPreviousSettledCarry({
      supabase,
      userId,
      currency: next.currency,
      beforeDate: next.startDate,
    });
    const payload = computeBudgetPeriod(
      {
        id: next.id,
        startDate: next.startDate,
        amount: next.amount,
        currency: next.currency,
        frequency: next.frequency,
      },
      allocations,
      savingsPct,
      carryIn
    );

    const { error } = await supabase.from("budget_periods").upsert(
      {
        user_id: userId,
        income_id: payload.income_id,
        currency: payload.currency,
        period_start: payload.period_start,
        period_end: payload.period_end,
        salary_amount: payload.salary_amount,
        allocations: payload.allocations,
        carry_in: payload.carry_in,
      },
      { onConflict: "user_id,income_id" }
    );
    if (error) throw error;
  } catch (err) {
    console.error("[syncBudgetPeriodForIncome] failed:", err);
  }
}
