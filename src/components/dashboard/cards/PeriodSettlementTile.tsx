/**
 * Dashboard tile summarising the immediately-past settled budget
 * period. Renders three groups when non-zero:
 *   - Rolled forward:  sum of positive carry_out (top 3 parents named)
 *   - Extra available to save:  sum of closed_out (the marquee number)
 *   - Over budget:  sum of positive overspend (reset cats' deficits)
 *
 * Fades out after 7 days via useLastSettledPeriod's built-in window so
 * it doesn't linger on the dashboard forever.
 *
 * Copy discipline (per plan §8):
 *   - "Rolled forward"  → carry_out on rollover cats
 *   - "Extra available to save"  → closed_out on reset cats.
 *     NEVER "saved" — savings semantics belong to the savings slot.
 *   - "Over budget"  → overspend (positive absolute).
 */

import React from "react";
import { format, parseISO } from "date-fns";
import { PiggyBankIcon, TrendingUpIcon, AlertTriangleIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useLastSettledPeriod } from "@/hooks/useLastSettledPeriod";
import { PARENT_CATEGORIES } from "@/utils/constants/categories";
import { SAVINGS_ID } from "@/utils/budget/defaults";

const PARENT_NAME_BY_ID = Object.fromEntries(
  PARENT_CATEGORIES.map((p) => [p.id, p.name])
) as Record<string, string>;

interface Contribution {
  parentId: string;
  amount: number;
}

function sumSpendingSlots(map: Record<string, number>): number {
  let sum = 0;
  for (const [k, v] of Object.entries(map)) {
    if (k === SAVINGS_ID) continue;
    sum += Number(v) || 0;
  }
  return sum;
}

function topContributions(
  map: Record<string, number>,
  predicate: (v: number) => boolean,
  n = 3
): Contribution[] {
  return Object.entries(map)
    .filter(([k]) => k !== SAVINGS_ID)
    .map(([k, v]) => ({ parentId: k, amount: Number(v) || 0 }))
    .filter((c) => predicate(c.amount))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, n);
}

export const PeriodSettlementTile: React.FC = () => {
  const { displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);
  const { data: settled, isLoading } = useLastSettledPeriod(displayCurrency);

  if (isLoading || !settled) return null;

  const rolledContribs = topContributions(settled.carry_out, (v) => v > 0);
  const rolledTotal = rolledContribs.reduce((s, c) => s + c.amount, 0);

  // Rollover overspend is stored as negative carry_out (per settlement
  // convention — see settleBudgetPeriod.ts). Reset overspend lives in
  // the separate overspend field. Union both here for the total.
  const rolloverDeficit = Object.entries(settled.carry_out)
    .filter(([k]) => k !== SAVINGS_ID)
    .reduce((s, [, v]) => s + Math.min(0, Number(v) || 0), 0);
  const resetOverspend = sumSpendingSlots(settled.overspend);
  const overspendTotal = Math.abs(rolloverDeficit) + resetOverspend;

  const closedOutTotal = sumSpendingSlots(settled.closed_out);

  // Nothing worth surfacing → hide.
  if (rolledTotal === 0 && closedOutTotal === 0 && overspendTotal === 0) {
    return null;
  }

  const settledDateLabel = format(parseISO(settled.closed_at), "MMM d");
  const periodLabel = `${format(parseISO(settled.period_start), "MMM d")} – ${format(parseISO(settled.period_end), "MMM d")}`;

  return (
    <Card className="bg-card border-border/50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Last period settled · {periodLabel}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Settled {settledDateLabel}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {closedOutTotal > 0 && (
            <div className="flex items-start gap-2.5">
              <PiggyBankIcon
                className="h-4 w-4 mt-0.5 shrink-0"
                style={{ color: "var(--color-success)" }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-sm font-medium">Extra available to save</p>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: "var(--color-success)" }}
                  >
                    +{formatCurrency(closedOutTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  From reset-category leftovers. Move it to Savings when you
                  transfer.
                </p>
              </div>
            </div>
          )}

          {rolledTotal > 0 && (
            <div className="flex items-start gap-2.5">
              <TrendingUpIcon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <p className="text-sm font-medium">Rolled forward</p>
                  <span className="text-sm font-bold tabular-nums text-primary">
                    +{formatCurrency(rolledTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {rolledContribs
                    .map(
                      (c) =>
                        `${PARENT_NAME_BY_ID[c.parentId] ?? c.parentId} +${formatCurrency(c.amount)}`
                    )
                    .join(" · ")}
                </p>
              </div>
            </div>
          )}

          {overspendTotal > 0 && (
            <div className="flex items-start gap-2.5">
              <AlertTriangleIcon className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-sm font-medium">Over budget</p>
                  <span className="text-sm font-bold tabular-nums text-destructive">
                    −{formatCurrency(overspendTotal)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {rolloverDeficit < 0
                    ? "Rollover deficits carry into this period."
                    : "Reset-category overspend closed with the cycle."}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(PeriodSettlementTile);
