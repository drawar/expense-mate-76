/**
 * Fetch the single most-recently-settled budget_period for a user +
 * currency. Powers the PeriodSettlementTile and the IncomeSavingsStack
 * "extra available to save from last period" line.
 *
 * Returns null when:
 *   - No settled period exists for this currency yet.
 *   - The most recent settled period closed more than N days ago
 *     (default 7) — settlement outcomes are shown for a limited window
 *     so the tile fades out and doesn't clutter the dashboard forever.
 */

import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parseISO } from "date-fns";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Currency } from "@/types";

export interface LastSettledPeriodRow {
  id: string;
  period_start: string;
  period_end: string;
  closed_at: string;
  currency: Currency;
  carry_out: Record<string, number>;
  closed_out: Record<string, number>;
  overspend: Record<string, number>;
  end_behavior_snapshot: Record<string, string>;
}

interface UseLastSettledPeriodOptions {
  /** Hide the row after this many days since closed_at. Default 7. */
  displayForDays?: number;
}

export function useLastSettledPeriod(
  currency: Currency,
  options: UseLastSettledPeriodOptions = {}
): { data: LastSettledPeriodRow | null; isLoading: boolean } {
  const { displayForDays = 7 } = options;
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["last_settled_period", user?.id ?? "anon", currency] as const,
    queryFn: async (): Promise<LastSettledPeriodRow | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("budget_periods")
        .select(
          "id, period_start, period_end, closed_at, currency, carry_out, closed_out, overspend, end_behavior_snapshot"
        )
        .eq("user_id", user.id)
        .eq("currency", currency)
        .not("closed_at", "is", null)
        .order("closed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data || !data.closed_at) return null;

      // Fade out after displayForDays. Comparison uses browser-local
      // "today" to match how the user perceives time.
      const daysSinceClose = differenceInDays(
        new Date(),
        parseISO(data.closed_at)
      );
      if (daysSinceClose > displayForDays) return null;

      return {
        id: data.id,
        period_start: data.period_start,
        period_end: data.period_end,
        closed_at: data.closed_at,
        currency: data.currency as Currency,
        carry_out: (data.carry_out as Record<string, number>) ?? {},
        closed_out: (data.closed_out as Record<string, number>) ?? {},
        overspend: (data.overspend as Record<string, number>) ?? {},
        end_behavior_snapshot:
          (data.end_behavior_snapshot as Record<string, string>) ?? {},
      };
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  return { data: query.data ?? null, isLoading: query.isLoading };
}
