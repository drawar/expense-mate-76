// components/dashboard/cards/BudgetSpendingCard.tsx
/**
 * Pay-period Budget & Spending card — single-view layout with a sort
 * selector. No tab toggle; the six categories are always visible and the
 * user picks how they're ordered:
 *
 *   - Spent      → highest dollar spend first
 *   - Remaining  → most budget-room left first
 *   - Total      → largest budget first
 *
 * Rows with no budget set are always pinned to the end (a "Set budget"
 * link takes the user to Settings). Reads the active budget_periods row
 * via useActiveBudgetPeriod; once period_end passes, the card flips to
 * an empty-state banner prompting a new Salary income entry.
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { PiggyBankIcon, TargetIcon } from "lucide-react";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import {
  useActiveBudgetPeriod,
  type AllocationLine,
} from "@/hooks/useActiveBudgetPeriod";
import type { Transaction } from "@/types";
import { CategoryIcon, type CategoryIconName } from "@/utils/constants/icons";
import { PeriodSettlementBody } from "@/components/dashboard/cards/PeriodSettlementTile";

interface BudgetSpendingCardProps {
  className?: string;
  transactions?: Transaction[];
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
  /**
   * Which pieces to render:
   *   "card"             — full standalone card (default): header + 3-col
   *                        internal grid. Used by mobile SummarySection.
   *   "kpi-only"         — just the Save First + hero rows + Last Settled
   *                        stack, no Card wrapper. Used inside
   *                        BudgetOverviewCard's left column.
   *   "categories-only"  — just the Categories header + sort + bar rows,
   *                        no Card wrapper. Used as BudgetOverviewCard's
   *                        bottom row.
   */
  layout?: "card" | "kpi-only" | "categories-only";
}

type SortBy = "spent" | "remaining" | "total";

const SORT_LABEL: Record<SortBy, string> = {
  spent: "Spent",
  remaining: "Remaining",
  total: "Total",
};

function statusColor(pctUsed: number): { bar: string; text: string } {
  if (!Number.isFinite(pctUsed) || pctUsed > 100) {
    return {
      bar: "bg-[var(--color-error)]",
      text: "text-[var(--color-error)]",
    };
  }
  if (pctUsed >= 80) {
    return {
      bar: "bg-[var(--color-warning)]",
      text: "text-[var(--color-warning)]",
    };
  }
  return {
    bar: "bg-[var(--color-success)]",
    text: "text-[var(--color-success)]",
  };
}

function sortAllocations(
  rows: AllocationLine[],
  sortBy: SortBy
): AllocationLine[] {
  const withBudget = rows.filter((r) => r.budgeted > 0);
  const withoutBudget = rows.filter((r) => r.budgeted === 0);
  const cmp = (a: AllocationLine, b: AllocationLine): number => {
    switch (sortBy) {
      case "spent":
        return b.spent - a.spent;
      case "remaining":
        return b.budgeted - b.spent - (a.budgeted - a.spent);
      case "total":
        return b.budgeted - a.budgeted;
    }
  };
  withBudget.sort(cmp);
  return [...withBudget, ...withoutBudget];
}

interface HeroTotals {
  budget: number;
  spent: number;
  left: number;
  isOver: boolean;
  pctUsed: number;
}

const HeroRow: React.FC<{
  title: string;
  windowLabel: string;
  totals: HeroTotals;
  formatCurrency: (n: number) => string;
}> = ({ title, windowLabel, totals, formatCurrency }) => {
  const status = statusColor(totals.pctUsed);
  return (
    <div className="py-1.5">
      {/* Title line — sits alone so the eye reads label → value cleanly. */}
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
        {title}
      </p>
      {/* Primary "$X left" is its own line so the number can breathe. */}
      <p
        className={`text-2xl font-semibold tracking-tight leading-tight mt-1.5 tabular-nums ${
          totals.isOver ? "text-[var(--color-error)]" : ""
        }`}
      >
        {formatCurrency(totals.left)}
        <span className="text-xs text-muted-foreground font-normal ml-1.5">
          left
        </span>
      </p>
      {/* Secondary context on its own line — of $X · window. */}
      <p className="text-[11px] text-muted-foreground mt-0.5">
        of {formatCurrency(totals.budget)} · {windowLabel.toLowerCase()}
      </p>
      {/* Progress bar with % inline at the end — one horizontal element,
          not two competing for the width. */}
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${status.bar}`}
            style={{ width: `${Math.min(100, totals.pctUsed)}%` }}
          />
        </div>
        <span
          className={`text-[11px] tabular-nums whitespace-nowrap ${status.text}`}
        >
          {totals.pctUsed.toFixed(0)}%
        </span>
      </div>
      {totals.isOver && (
        <p className="text-[11px] text-[var(--color-error)] font-medium mt-1">
          Over by {formatCurrency(totals.spent - totals.budget)}
        </p>
      )}
    </div>
  );
};

const BudgetSpendingCard: React.FC<BudgetSpendingCardProps> = ({
  className = "",
  transactions = [],
  onCategoryClick,
  layout = "card",
}) => {
  const navigate = useNavigate();
  const { displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);
  const [sortBy, setSortBy] = React.useState<SortBy>("spent");

  const { period, allocations, savingsBudgeted, isLoading } =
    useActiveBudgetPeriod(displayCurrency, transactions);

  const orderedAllocations = React.useMemo(
    () => sortAllocations(allocations, sortBy),
    [allocations, sortBy]
  );

  // Split hero totals by cadence group so each sub-total lives in a
  // single time window instead of mixing pay-period and month numbers.
  const perPeriodRows = allocations.filter((r) => r.cadence === "per_period");
  const monthlyRows = allocations.filter((r) => r.cadence === "monthly");

  const groupTotals = (rows: typeof allocations) => {
    const budget = rows.reduce((s, r) => s + r.budgeted, 0);
    const spent = rows.reduce((s, r) => s + r.spent, 0);
    return {
      budget,
      spent,
      left: Math.max(0, budget - spent),
      isOver: spent > budget && budget > 0,
      pctUsed: budget > 0 ? (spent / budget) * 100 : 0,
    };
  };
  const perPeriodTotals = groupTotals(perPeriodRows);
  const monthlyTotals = groupTotals(monthlyRows);

  // ─── KPI SECTION: Save First + This Period + This Month + Last Settled
  const kpiSection =
    !isLoading && period ? (
      <div className="flex flex-col gap-3 min-w-0">
        {savingsBudgeted > 0 && (
          <div className="rounded-lg bg-[var(--color-accent-subtle)] px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <PiggyBankIcon
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--color-success)" }}
              />
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
                Save first
              </p>
            </div>
            <p
              className="text-lg font-semibold tabular-nums leading-tight mt-1.5"
              style={{ color: "var(--color-success)" }}
            >
              {formatCurrency(savingsBudgeted)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              of {formatCurrency(period.salary_amount)}
            </p>
          </div>
        )}
        {perPeriodRows.length > 0 && (
          <HeroRow
            title="This period"
            windowLabel={`ends ${format(parseISO(period.period_end), "MMM d")}`}
            totals={perPeriodTotals}
            formatCurrency={formatCurrency}
          />
        )}
        {monthlyRows.length > 0 && (
          <HeroRow
            title="This month"
            windowLabel={`${format(startOfMonth(parseISO(period.period_start)), "MMM d")}–${format(endOfMonth(parseISO(period.period_start)), "MMM d")}`}
            totals={monthlyTotals}
            formatCurrency={formatCurrency}
          />
        )}
        <PeriodSettlementBody className="border-t border-border/50 pt-3" />
      </div>
    ) : null;

  // "kpi-only" bails early
  if (layout === "kpi-only") {
    if (isLoading || !period) return null;
    return kpiSection;
  }

  // ─── CATEGORIES SECTION: header + sort + bar rows
  const categoriesSection =
    !isLoading && period ? (
      <div className="min-w-0">
        {/* Categories header + sort */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">Categories</p>
            <p className="text-[11px] text-muted-foreground leading-none">
              Bars show budget used
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-[11px] text-muted-foreground">Sort by</span>
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              <SelectTrigger className="h-7 w-auto min-w-[110px] text-xs">
                <SelectValue>{SORT_LABEL[sortBy]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spent">Spent</SelectItem>
                <SelectItem value="remaining">Remaining</SelectItem>
                <SelectItem value="total">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {orderedAllocations.map((row) => {
            const status = statusColor(row.pctUsed);
            const hasBudget = row.budgeted > 0;
            const remaining = row.budgeted - row.spent;
            const isOverRow = remaining < 0 && hasBudget;

            // One number per row, driven by the sort dimension.
            //   spent      → "$X spent"
            //   remaining  → "$X left" (or red "-$Y over" when overspent)
            //   total      → "$X budget"
            let primaryNumber = "";
            let primaryLabel = "";
            let primaryTone: "default" | "error" = "default";
            if (!hasBudget) {
              primaryNumber = formatCurrency(row.spent);
              primaryLabel = "spent";
            } else if (sortBy === "spent") {
              primaryNumber = formatCurrency(row.spent);
              primaryLabel = "spent";
            } else if (sortBy === "remaining") {
              if (isOverRow) {
                primaryNumber = `-${formatCurrency(-remaining)}`;
                primaryLabel = "over";
                primaryTone = "error";
              } else {
                primaryNumber = formatCurrency(remaining);
                primaryLabel = "left";
              }
            } else {
              primaryNumber = formatCurrency(row.budgeted);
              primaryLabel = "budget";
            }

            return (
              <button
                key={row.parentId}
                type="button"
                onClick={() => {
                  onCategoryClick?.(row.parentId, row.name);
                  const params = new URLSearchParams();
                  params.set("parent", row.parentId);
                  navigate(`/transactions?${params.toString()}`);
                }}
                className={`w-full grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2.5 py-2 px-1 hover:bg-muted/50 active:bg-muted/70 transition-colors text-left ${hasBudget ? "" : "opacity-60"}`}
              >
                <CategoryIcon
                  iconName={row.icon as CategoryIconName}
                  size={20}
                  color={row.color}
                />
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <p className="text-sm font-medium truncate">{row.name}</p>
                    {row.cadence === "monthly" && (
                      <span className="text-[9px] uppercase tracking-wide text-muted-foreground bg-muted/60 px-1 py-0.5 rounded whitespace-nowrap">
                        Monthly
                      </span>
                    )}
                    {row.carryIn !== 0 && (
                      <span
                        className={`text-[10px] tabular-nums whitespace-nowrap ${
                          row.carryIn > 0 ? "text-primary" : "text-destructive"
                        }`}
                        title={
                          row.carryIn > 0
                            ? `${formatCurrency(row.carryIn)} rolled forward from last cycle`
                            : `${formatCurrency(-row.carryIn)} overspend carried from last cycle`
                        }
                      >
                        {row.carryIn > 0 ? "+" : "−"}
                        {formatCurrency(Math.abs(row.carryIn))} rolled
                      </span>
                    )}
                  </div>
                  {hasBudget ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${status.bar}`}
                          style={{
                            width: `${Math.min(100, row.pctUsed)}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-[11px] tabular-nums w-9 text-right ${status.text}`}
                      >
                        {Number.isFinite(row.pctUsed)
                          ? `${row.pctUsed.toFixed(0)}%`
                          : "—"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      No budget set
                    </p>
                  )}
                </div>
                <div className="text-right whitespace-nowrap">
                  {hasBudget ? (
                    <>
                      <p
                        className={`text-sm font-medium tabular-nums ${
                          primaryTone === "error"
                            ? "text-[var(--color-error)]"
                            : ""
                        }`}
                      >
                        {primaryNumber}
                      </p>
                      <p
                        className={`text-[10px] uppercase tracking-wide ${
                          primaryTone === "error"
                            ? "text-[var(--color-error)]"
                            : "text-muted-foreground"
                        }`}
                      >
                        {primaryLabel}
                      </p>
                    </>
                  ) : (
                    <Link
                      to="/settings"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Set budget
                    </Link>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  // Categories-only: no Card wrapper.
  if (layout === "categories-only") {
    return (
      categoriesSection ?? (
        <div className="py-3 text-sm text-muted-foreground animate-pulse">
          Loading budget…
        </div>
      )
    );
  }

  // Full card layout: header + 2-col grid (KPI + Categories).
  return (
    <Card className={className}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TargetIcon className="h-5 w-5 text-primary" />
          Budget & Spending
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {isLoading ? (
          <div className="py-3 text-sm text-muted-foreground animate-pulse">
            Loading budget…
          </div>
        ) : !period ? (
          <div className="py-3 space-y-2">
            <p className="text-sm text-muted-foreground">
              No active pay-period budget. Add an income named
              &quot;Salary&quot; or &quot;Paycheck&quot; to activate one.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/income">Add Salary</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[33%_1fr]">
            {kpiSection}
            {categoriesSection}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(BudgetSpendingCard);
