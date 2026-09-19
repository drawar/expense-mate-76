/**
 * Bounded forward walker for historical settlement drift.
 *
 * Fires (fire-and-forget, never throws) after:
 *   - Transaction insert/update/delete whose date falls inside any
 *     already-settled period's window.
 *   - Income insert/update/delete — a shift in period start/end can
 *     flip month-close ownership.
 *
 * Steps per invocation:
 *   1. settleDuePeriodsForUser  — settles any newly-due open periods
 *      (period_end < today AND closed_at IS NULL).
 *   2. resettleClosedPeriodsForUser  — re-runs the pure settlement for
 *      each closed period from `fromDate` forward. The fingerprint
 *      guard short-circuits no-ops at the DB layer AND stops the walk
 *      early once a period comes back stable.
 *
 * Debounce: per-user 100ms trailing timeout so a bulk-import fanning 50
 * transaction saves triggers exactly one walker run.
 *
 * Bounded: usually 1-3 periods per user's active-plus-recently-closed
 * window; upper bound ~50 with fingerprint short-circuit terminating
 * the chain the first time a period comes back stable.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { formatISO } from "date-fns";

import {
  resettleClosedPeriodsForUser,
  settleDuePeriodsForUser,
} from "./settleDuePeriodsForUser";

const pending = new Map<string, ReturnType<typeof setTimeout>>();

interface ScheduleArgs {
  supabase: SupabaseClient;
  userId: string;
  /**
   * ISO "YYYY-MM-DD" — earliest date the edit could have affected. The
   * walker only touches closed periods with period_end >= this. Passing
   * a very old date is safe (chain terminates via fingerprint) but
   * wastes a scan; prefer the actual tx date or income start date.
   */
  fromDateISO: string;
  delayMs?: number;
}

export function scheduleResettleFromDate({
  supabase,
  userId,
  fromDateISO,
  delayMs = 100,
}: ScheduleArgs): void {
  const existing = pending.get(userId);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(async () => {
    pending.delete(userId);
    try {
      const todayISO = formatISO(new Date(), { representation: "date" });
      // Newly due periods first — this establishes their closed_at +
      // carry_out so the closed-periods walk sees them.
      await settleDuePeriodsForUser({ supabase, userId, todayISO });
      // Then re-run closed periods from the edit's date forward.
      await resettleClosedPeriodsForUser({ supabase, userId, fromDateISO });
    } catch (err) {
      console.error("[scheduleResettleFromDate] failed:", err);
    }
  }, delayMs);

  pending.set(userId, timer);
}
