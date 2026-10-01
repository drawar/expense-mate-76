/**
 * Client-side "trigger" that keeps the budget_periods row for a salary income
 * in sync when the income is inserted/updated/renamed.
 *
 * Called from useRecurringIncome.saveIncome immediately after a successful
 * upsert. See the handling matrix in the pay-period budget feature plan
 * (nested-leaping-wreath.md §"Trigger logic — client-side, in saveIncome").
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { formatISO, parseISO, subDays } from "date-fns";

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
 * When a new/edited salary income lands, the *previous* pay period's
 * cadence-guessed period_end may no longer be accurate — the real next
 * payday is now known. Align the immediately-preceding OPEN period's
 * period_end to (next.startDate - 1 day) so periods stay contiguous with
 * actual paychecks instead of a cadence projection.
 *
 * Only touches open (unsettled) periods — a period that already closed on
 * the old cadence guess is left alone (rare; a separate fix). Best-effort:
 * never throws, so a failed alignment doesn't roll back the income save.
 */
async function alignPrecedingPeriodEnd(
  supabase: SupabaseClient,
  userId: string,
  currency: string,
  nextIncomeId: string,
  nextStartDate: string
): Promise<void> {
  try {
    const { data: preceding, error } = await supabase
      .from("budget_periods")
      .select("id, period_start, period_end")
      .eq("user_id", userId)
      .eq("currency", currency)
      .is("closed_at", null)
      .neq("income_id", nextIncomeId)
      .lt("period_start", nextStartDate)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!preceding) return;

    const newEnd = formatISO(subDays(parseISO(nextStartDate), 1), {
      representation: "date",
    });
    // Skip: would produce a zero/negative-length period (e.g. paychecks
    // logged out of chronological order), or nothing actually changed.
    if (newEnd <= preceding.period_start || newEnd === preceding.period_end) {
      return;
    }

    const { error: updateErr } = await supabase
      .from("budget_periods")
      .update({ period_end: newEnd })
      .eq("id", preceding.id);
    if (updateErr) throw updateErr;
  } catch (err) {
    console.error("[alignPrecedingPeriodEnd] failed:", err);
  }
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

    // Align the immediately-preceding open period's end date to the real
    // payday now that we know it. Runs regardless of next's own settlement
    // state below — this touches a different row.
    await alignPrecedingPeriodEnd(
      supabase,
      userId,
      next.currency,
      next.id,
      next.startDate
    );

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
