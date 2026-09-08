// components/dashboard/cards/BudgetSpendingCard.tsx
/**
 * Pay-period Budget & Spending card — two tabs:
 *
 *  1. Budget progress — "Left to spend" hero + per-category rows with a
 *     "$X left" primary number (loss-averse framing).
 *  2. Spending breakdown — horizontal-bar chart of actual dollars spent
 *     per category, sorted desc, with a total at the bottom.
 *
 * Reads the active budget_periods row via useActiveBudgetPeriod (grace
 * window: +3 days after period_end). Two-tone bar colors: green ≤ 80%,
 * amber 80–100%, red > 100%.
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { PiggyBankIcon, TargetIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import {
  useActiveBudgetPeriod,
  type AllocationLine,
} from "@/hooks/useActiveBudgetPeriod";
import type { Transaction } from "@/types";
import { CategoryIcon, type CategoryIconName } from "@/utils/constants/icons";

interface BudgetSpendingCardProps {
  className?: string;
  transactions?: Transaction[];
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
}

type Tab = "progress" | "breakdown";

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

const BudgetSpendingCard: React.FC<BudgetSpendingCardProps> = ({
  className = "",
  transactions = [],
  onCategoryClick,
}) => {
  const navigate = useNavigate();
  const { displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);
  const [tab, setTab] = React.useState<Tab>("progress");

  const {
    period,
    allocations,
    savingsBudgeted,
    totalBudgeted,
    totalSpent,
    isInGracePeriod,
    isLoading,
  } = useActiveBudgetPeriod(displayCurrency, transactions);

  // Rows with budgeted > 0 first (canonical PARENT_CATEGORIES order); zero
  // to the end so always-empty ones don't dominate visual scan.
  const orderedAllocations = React.useMemo<AllocationLine[]>(() => {
    const withBudget = allocations.filter((a) => a.budgeted > 0);
    const withoutBudget = allocations.filter((a) => a.budgeted === 0);
    return [...withBudget, ...withoutBudget];
  }, [allocations]);

  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const leftToSpend = Math.max(0, totalBudgeted - totalSpent);
  const isOver = totalSpent > totalBudgeted;

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
          <>
            {/* Pay-yourself-first strip (kept from prior design) */}
            {savingsBudgeted > 0 && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-[var(--color-accent-subtle)] px-3 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <PiggyBankIcon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: "var(--color-success)" }}
                  />
                  <p className="text-sm truncate">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground mr-2">
                      Save first
                    </span>
                    <span className="font-medium">
                      {formatCurrency(savingsBudgeted)}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      of {formatCurrency(period.salary_amount)}
                    </span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  Ends {format(parseISO(period.period_end), "MMM d")}
                  {isInGracePeriod ? " · grace" : ""}
                </p>
              </div>
            )}

            {/* Hero: Left to spend */}
            <div className="mb-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Left to spend
              </p>
              <p
                className={`text-3xl font-medium tracking-tight leading-none mt-1 ${
                  isOver ? "text-[var(--color-error)]" : ""
                }`}
              >
                {formatCurrency(leftToSpend)}
              </p>
              <div className="mt-2">
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${statusColor(overallPct).bar}`}
                    style={{ width: `${Math.min(100, overallPct)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {formatCurrency(totalSpent)} spent of{" "}
                  {formatCurrency(totalBudgeted)} · {overallPct.toFixed(0)}%
                  used
                  {isOver && (
                    <span className="text-[var(--color-error)] font-medium">
                      {" · over by "}
                      {formatCurrency(totalSpent - totalBudgeted)}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Allowance after savings
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-3 inline-flex rounded-full bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTab("progress")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  tab === "progress"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Budget progress
              </button>
              <button
                type="button"
                onClick={() => setTab("breakdown")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  tab === "breakdown"
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Spending breakdown
              </button>
            </div>

            {tab === "progress" ? (
              <BudgetProgressTab
                rows={orderedAllocations}
                formatCurrency={formatCurrency}
                onRowClick={(row) => {
                  onCategoryClick?.(row.parentId, row.name);
                  const params = new URLSearchParams();
                  params.set("parent", row.parentId);
                  navigate(`/transactions?${params.toString()}`);
                }}
              />
            ) : (
              <SpendingBreakdownTab
                rows={allocations}
                totalSpent={totalSpent}
                formatCurrency={formatCurrency}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// -----------------------------------------------------------------------------
// Budget progress tab — "$X left" per category

function BudgetProgressTab({
  rows,
  formatCurrency,
  onRowClick,
}: {
  rows: AllocationLine[];
  formatCurrency: (n: number) => string;
  onRowClick: (row: AllocationLine) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        Category budgets
      </p>
      {rows.map((row) => {
        const status = statusColor(row.pctUsed);
        const hasBudget = row.budgeted > 0;
        const left = Math.max(0, row.budgeted - row.spent);
        const isOverRow = row.spent > row.budgeted && hasBudget;
        return (
          <button
            key={row.parentId}
            type="button"
            onClick={() => onRowClick(row)}
            className={`w-full flex items-center gap-2.5 py-1 px-1.5 rounded-md hover:bg-muted/50 active:bg-muted/70 transition-colors text-left ${hasBudget ? "" : "opacity-60"}`}
          >
            <CategoryIcon
              iconName={row.icon as CategoryIconName}
              size={16}
              color={row.color}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm truncate">{row.name}</p>
                  {hasBudget && (
                    <p className="text-[11px] text-muted-foreground">
                      {formatCurrency(row.spent)} of{" "}
                      {formatCurrency(row.budgeted)}
                    </p>
                  )}
                </div>
                <div className="text-right whitespace-nowrap">
                  {hasBudget ? (
                    <>
                      <p
                        className={`text-sm font-medium tabular-nums ${
                          isOverRow ? "text-[var(--color-error)]" : ""
                        }`}
                      >
                        {isOverRow
                          ? `-${formatCurrency(row.spent - row.budgeted)}`
                          : `${formatCurrency(left)} left`}
                      </p>
                      <p className={`text-[11px] tabular-nums ${status.text}`}>
                        {Number.isFinite(row.pctUsed)
                          ? `${row.pctUsed.toFixed(0)}%`
                          : "—"}
                      </p>
                    </>
                  ) : (
                    <Link
                      to="/settings"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary hover:underline"
                    >
                      Set budget
                    </Link>
                  )}
                </div>
              </div>
              {hasBudget && (
                <div className="mt-1 h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${status.bar}`}
                    style={{ width: `${Math.min(100, row.pctUsed)}%` }}
                  />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Spending breakdown tab — horizontal bars of actual $ spent, sorted desc

function SpendingBreakdownTab({
  rows,
  totalSpent,
  formatCurrency,
}: {
  rows: AllocationLine[];
  totalSpent: number;
  formatCurrency: (n: number) => string;
}) {
  const sorted = React.useMemo(
    () => [...rows].sort((a, b) => b.spent - a.spent),
    [rows]
  );
  const maxSpent = Math.max(1, ...sorted.map((r) => r.spent));

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        Where your money went
      </p>
      <div className="space-y-1.5">
        {sorted.map((row) => {
          const pctOfMax = (row.spent / maxSpent) * 100;
          return (
            <div
              key={row.parentId}
              className="flex items-center gap-2.5 py-0.5"
            >
              <CategoryIcon
                iconName={row.icon as CategoryIconName}
                size={14}
                color={row.color}
              />
              <span className="text-xs truncate w-24 flex-shrink-0">
                {row.name}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${pctOfMax}%` }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums whitespace-nowrap w-16 text-right">
                {formatCurrency(row.spent)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-sm font-medium">Total spent</span>
        <span className="text-base font-medium tabular-nums">
          {formatCurrency(totalSpent)}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Bar lengths compare actual dollars spent.
      </p>
    </div>
  );
}

export default React.memo(BudgetSpendingCard);
