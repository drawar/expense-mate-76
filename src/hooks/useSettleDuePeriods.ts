/**
 * Lazy client trigger for end-of-cycle settlement.
 *
 * Mounts once at the top of the authenticated Dashboard shell. On the
 * first mount per session, scans budget_periods for rows with
 * `period_end < today (browser local)` AND `closed_at IS NULL`, settles
 * each via the pure settleBudgetPeriod function + guarded UPDATE, then
 * invalidates the budget query keys so the dashboard picks up the new
 * carry_out and the next period's carry_in.
 *
 * This is the "just opened the app" fallback path. The primary path is
 * the nightly Supabase Edge Function (C11) that runs against every user
 * at 00:15 UTC. Both use the same fingerprint-guarded UPDATE, so the
 * loser sees 0 rows affected and moves on — races are harmless.
 *
 * Placement rationale (not in useActiveBudgetPeriod, not in
 * useRecurringIncome.saveIncome): a read hook fires per consumer;
 * saveIncome fires only on income edits. A dedicated boot-time hook is
 * the least-surprising home for a "once per session" side effect.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatISO } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { settleDuePeriodsForUser } from "@/utils/budget/settleDuePeriodsForUser";

export function useSettleDuePeriods(): void {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    if (firedRef.current) return;
    firedRef.current = true;

    const todayISO = formatISO(new Date(), { representation: "date" });
    settleDuePeriodsForUser({ supabase, userId: user.id, todayISO })
      .then(({ settled, skipped }) => {
        if (settled > 0) {
          console.info(
            `[useSettleDuePeriods] settled ${settled} period(s), skipped ${skipped}`
          );
          queryClient.invalidateQueries({ queryKey: ["budget_periods"] });
          queryClient.invalidateQueries({ queryKey: ["budget_allocations"] });
        }
      })
      .catch((err) => {
        console.error("[useSettleDuePeriods] fired but failed:", err);
      });
  }, [user?.id, queryClient]);
}
