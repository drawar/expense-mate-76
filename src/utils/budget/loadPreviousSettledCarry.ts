/**
 * Look up the immediately-preceding settled budget_periods row for a
 * (user, currency) pair and return its carry_out filtered down to
 * rollover slots only.
 *
 * "Settled" means `closed_at IS NOT NULL`. Reset categories in the prior
 * snapshot never carry — even if the user has since flipped them to
 * rollover, the snapshot's `end_behavior_snapshot` is the truth of how
 * that period ACTUALLY settled, and we honor it.
 *
 * Returns {} if:
 *   - No prior settled period exists (first-time user, or the prior
 *     period is still open — cron/lazy haven't run yet).
 *   - The prior period's carry_out is entirely reset-only.
 *
 * The forward walker (resettleFromDate) re-runs this on transaction
 * edits to update in-flight `carry_in` after a late settle catches up.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Currency } from "@/types";
import { SAVINGS_ID } from "./defaults";

interface LoadArgs {
  supabase: SupabaseClient;
  userId: string;
  currency: Currency;
  /** ISO date "YYYY-MM-DD" — return the most recent settled row whose period_end < this. */
  beforeDate: string;
}

export async function loadPreviousSettledCarry({
  supabase,
  userId,
  currency,
  beforeDate,
}: LoadArgs): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("budget_periods")
    .select("carry_out, end_behavior_snapshot")
    .eq("user_id", userId)
    .eq("currency", currency)
    .lt("period_end", beforeDate)
    .not("closed_at", "is", null)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[loadPreviousSettledCarry] failed:", error);
    return {};
  }
  if (!data) return {};

  const carryOut = (data.carry_out ?? {}) as Record<string, unknown>;
  const endBehaviorSnap = (data.end_behavior_snapshot ?? {}) as Record<
    string,
    unknown
  >;

  const out: Record<string, number> = {};
  for (const [key, rawValue] of Object.entries(carryOut)) {
    if (key === SAVINGS_ID) continue;
    // Only rollover slots carry. If snapshot missing for a key, assume
    // reset (the safer default) and drop it.
    if (endBehaviorSnap[key] !== "rollover") continue;
    const n = Number(rawValue);
    if (!Number.isFinite(n) || n === 0) continue;
    out[key] = n;
  }
  return out;
}
