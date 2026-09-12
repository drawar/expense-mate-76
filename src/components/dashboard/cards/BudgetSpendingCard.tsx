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
import { format, parseISO } from "date-fns";

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

interface BudgetSpendingCardProps {
  className?: string;
  transactions?: Transaction[];
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
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

const BudgetSpendingCard: React.FC<BudgetSpendingCardProps> = ({
  className = "",
  transactions = [],
  onCategoryClick,
}) => {
  const navigate = useNavigate();
  const { displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);
  const [sortBy, setSortBy] = React.useState<SortBy>("spent");

  const {
    period,
    allocations,
    savingsBudgeted,
    totalBudgeted,
    totalSpent,
    isLoading,
  } = useActiveBudgetPeriod(displayCurrency, transactions);

  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const leftToSpend = Math.max(0, totalBudgeted - totalSpent);
  const isOver = totalSpent > totalBudgeted;

  const orderedAllocations = React.useMemo(
    () => sortAllocations(allocations, sortBy),
    [allocations, sortBy]
  );

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
            {/* Pay-yourself-first strip */}
            {savingsBudgeted > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-[var(--color-accent-subtle)] px-3 py-2">
                <PiggyBankIcon
                  className="h-4 w-4 flex-shrink-0"
                  style={{ color: "var(--color-success)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">
                      Save first
                    </p>
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap leading-none">
                      Ends {format(parseISO(period.period_end), "MMM d")}
                    </p>
                  </div>
                  <p className="text-sm mt-0.5 truncate">
                    <span className="font-medium">
                      {formatCurrency(savingsBudgeted)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {" "}
                      of {formatCurrency(period.salary_amount)}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* LEFT TO SPEND hero */}
            <div className="mb-3 rounded-lg border border-border/50 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground leading-none">
                Left to spend
              </p>
              <p
                className={`text-3xl font-medium tracking-tight leading-none mt-1.5 ${
                  isOver ? "text-[var(--color-error)]" : ""
                }`}
              >
                {formatCurrency(leftToSpend)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${statusColor(overallPct).bar}`}
                    style={{ width: `${Math.min(100, overallPct)}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {overallPct.toFixed(0)}% used
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {formatCurrency(totalSpent)} spent of{" "}
                {formatCurrency(totalBudgeted)}
                {isOver && (
                  <span className="text-[var(--color-error)] font-medium">
                    {" · over by "}
                    {formatCurrency(totalSpent - totalBudgeted)}
                  </span>
                )}
                {" · Allowance after savings"}
              </p>
            </div>

            {/* Categories header + sort */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="text-sm font-medium">Categories</p>
                <p className="text-[11px] text-muted-foreground leading-none">
                  Bars show budget used
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[11px] text-muted-foreground">
                  Sort by
                </span>
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
                      <p className="text-sm font-medium truncate">{row.name}</p>
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(BudgetSpendingCard);
