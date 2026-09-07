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
  PARENT_CATEGORY_IDS,
  type ParentCategoryId,
} from "./defaults";
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
): Promise<Record<ParentCategoryId, number>> {
  const { data, error } = await supabase
    .from("budget_allocations")
    .select("parent_category_id, percentage")
    .eq("user_id", userId);
  if (error) throw error;
  const merged: Record<ParentCategoryId, number> = { ...DEFAULT_ALLOCATIONS };
  for (const row of data ?? []) {
    if (
      (PARENT_CATEGORY_IDS as readonly string[]).includes(
        row.parent_category_id
      )
    ) {
      merged[row.parent_category_id as ParentCategoryId] = Number(
        row.percentage
      );
    }
  }
  return merged;
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
    const nextMatches =
      matchesSalary(next.name) && next.currency === displayCurrency;
    const prevMatches =
      !!prev && matchesSalary(prev.name) && prev.currency === displayCurrency;

    // Cases (d) and (e): dropped out of "salary + right currency" — clean up.
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
    const allocations = await loadAllocations(supabase, userId);
    const payload = computeBudgetPeriod(
      {
        id: next.id,
        startDate: next.startDate,
        amount: next.amount,
        currency: next.currency,
        frequency: next.frequency,
      },
      allocations
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
      },
      { onConflict: "user_id,income_id" }
    );
    if (error) throw error;
  } catch (err) {
    console.error("[syncBudgetPeriodForIncome] failed:", err);
  }
}
