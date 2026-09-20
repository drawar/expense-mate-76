// components/dashboard/cards/BudgetOverviewCard.tsx
/**
 * Combined overview card that folds three previously-separate cards
 * into one two-row layout to eliminate dashboard white space.
 *
 * Row 1  ──  [ KPI stack (~33%)  ][   Spending trajectory chart   ]
 *              - Saved this period (%)
 *              - Save First
 *              - This period left
 *              - This month left
 *              - Last period settled
 *
 * Row 2  ──  [                Categories bar chart                 ]
 *
 * Composition:
 *   - `SavingsHero` (defined here) replaces IncomeSavingsStack's
 *     "You've saved this period" tile in compact form.
 *   - `<BudgetSpendingCard layout="kpi-only" />` renders Save First +
 *     hero rows + Last Settled as a bare block (no Card wrapper).
 *   - `<SpendingOverviewCard bare />` renders the chart + header
 *     without its own Card wrapper.
 *   - `<BudgetSpendingCard layout="categories-only" />` renders just
 *     the categories bar chart.
 *
 * Kills three tiles that were pure whitespace or duplicative:
 *   - IncomeSavingsStack's "This paycheck" sub-tile (info folded into
 *     the Save First strip which shows `of $paycheck`).
 *   - The empty upper-left region of the previous SpendingOverviewCard.
 *   - The empty col-2 top of the previous BudgetSpendingCard.
 */

import React from "react";
import NumberFlow from "@number-flow/react";
import { format, parseISO } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useActiveBudgetPeriod } from "@/hooks/useActiveBudgetPeriod";
import BudgetSpendingCard from "@/components/dashboard/cards/BudgetSpendingCard";
import SpendingOverviewCard from "@/components/dashboard/cards/SpendingOverviewCard";

/**
 * Compact "You've saved this period" KPI — replaces the tall
 * IncomeSavingsStack tile. Same paycheck-scoped math (salary −
 * periodOnlyTotalSpent) but rendered as a horizontal strip that fits
 * above the Save First tile in the KPI column.
 */
const SavingsHero: React.FC = () => {
  const { displayCurrency, dashboardData } = useDashboardContext();
  const filteredTransactions = dashboardData?.filteredTransactions ?? [];
  const { period, periodOnlyTotalSpent } = useActiveBudgetPeriod(
    displayCurrency,
    filteredTransactions
  );

  if (!period) return null;

  const salary = period.salary_amount;
  const savings = salary - periodOnlyTotalSpent;
  const savingsPct = salary > 0 ? Math.round((savings / salary) * 100) : 0;
  const positive = savings >= 0;
  const periodLabel = `${format(parseISO(period.period_start), "MMM d")}–${format(parseISO(period.period_end), "MMM d")}`;

  return (
    <div className="rounded-lg border border-border/50 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
        {positive ? "Saved this period" : "Over budget this period"}
      </p>
      <div className="flex items-baseline gap-2 mt-1.5">
        <p
          className={`text-2xl font-semibold tracking-tight leading-none tabular-nums ${
            positive ? "text-primary" : "text-destructive"
          }`}
        >
          <NumberFlow
            value={savings}
            format={{
              style: "currency",
              currency: displayCurrency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              signDisplay: "exceptZero",
            }}
          />
        </p>
        <p
          className={`text-sm font-semibold tabular-nums ${
            positive ? "text-primary" : "text-destructive"
          }`}
        >
          <NumberFlow value={savingsPct} suffix="%" />
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        of paycheck · {periodLabel}
      </p>
    </div>
  );
};

interface BudgetOverviewCardProps {
  className?: string;
}

const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({
  className = "",
}) => {
  const { dashboardData } = useDashboardContext();
  const filteredTransactions = dashboardData?.filteredTransactions ?? [];

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Row 1: KPI stack | Spending chart */}
        <div className="grid gap-4 md:grid-cols-[33%_1fr]">
          <div className="flex flex-col gap-3 min-w-0">
            <SavingsHero />
            <BudgetSpendingCard
              transactions={filteredTransactions}
              layout="kpi-only"
            />
          </div>
          <div className="min-w-0">
            <SpendingOverviewCard bare />
          </div>
        </div>

        {/* Row 2: Categories bar chart full width */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <BudgetSpendingCard
            transactions={filteredTransactions}
            layout="categories-only"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(BudgetOverviewCard);
