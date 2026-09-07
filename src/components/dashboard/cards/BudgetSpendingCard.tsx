// components/dashboard/cards/BudgetSpendingCard.tsx
/**
 * Pay-period Budget & Spending card — the primary spent-vs-budgeted surface.
 *
 * Compact layout:
 *  - Single-row header: Save-first pill · Spent-of-budget · Status/ends
 *  - Single-line category rows: icon · name · inline progress bar · dollars · %
 *  - Two-tone bars: green ≤ 80%, amber 80–100%, red > 100%
 *  - Empty-state banner when no active period.
 *
 * Reads the active budget_periods row via useActiveBudgetPeriod (3-day
 * grace after period_end).
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { PiggyBankIcon, TargetIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

  const {
    period,
    allocations,
    savingsBudgeted,
    totalBudgeted,
    totalSpent,
    isInGracePeriod,
    isLoading,
  } = useActiveBudgetPeriod(displayCurrency, transactions);

  const overallPct = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const overallStatus = statusColor(overallPct);
  const statusLabel =
    totalSpent > totalBudgeted
      ? "Over budget"
      : overallPct >= 80
        ? "Nearing limit"
        : "On track";

  // Rows with budgeted > 0 first (canonical PARENT_CATEGORIES order); zero
  // to the end so the always-empty ones don't dominate visual scan.
  const orderedAllocations = React.useMemo<AllocationLine[]>(() => {
    const withBudget = allocations.filter((a) => a.budgeted > 0);
    const withoutBudget = allocations.filter((a) => a.budgeted === 0);
    return [...withBudget, ...withoutBudget];
  }, [allocations]);

  return (
    <Card className={className}>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <TargetIcon className="h-4 w-4 text-primary" />
          Budget & Spending
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {isLoading ? (
          <div className="py-3 text-sm text-muted-foreground animate-pulse">
            Loading budget…
          </div>
        ) : !period ? (
          <div className="py-3 flex items-center justify-between gap-3">
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
            {/* Compact header: Save-first pill · Spent · Status */}
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 mb-2">
              {savingsBudgeted > 0 ? (
                <div className="flex items-center gap-2 rounded-md bg-[var(--color-accent-subtle)] px-2.5 py-1.5 min-w-0">
                  <PiggyBankIcon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: "var(--color-success)" }}
                  />
                  <div className="min-w-0 leading-tight">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Save first
                    </p>
                    <p className="text-sm font-medium truncate">
                      {formatCurrency(savingsBudgeted)}{" "}
                      <span className="text-muted-foreground text-xs">
                        of {formatCurrency(period.salary_amount)}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div />
              )}
              <div className="text-right sm:text-left leading-tight">
                <p className="text-xl font-medium">
                  {formatCurrency(totalSpent)}
                  <span className="text-sm text-muted-foreground font-normal">
                    {" "}
                    of {formatCurrency(totalBudgeted)}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Spent of period budget
                </p>
              </div>
              <div className="text-right leading-tight">
                <p className={`text-sm font-medium ${overallStatus.text}`}>
                  {statusLabel}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Ends {format(parseISO(period.period_end), "MMM d")}
                  {isInGracePeriod ? " · grace" : ""}
                </p>
              </div>
            </div>

            <Progress
              value={Math.min(100, overallPct)}
              className="h-1.5 mb-3"
              indicatorClassName={overallStatus.bar}
            />

            {/* Single-line category rows */}
            <div className="space-y-0.5">
              {orderedAllocations.map((row) => {
                const status = statusColor(row.pctUsed);
                const hasBudget = row.budgeted > 0;
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
                    className={`w-full grid grid-cols-[16px_minmax(0,1fr)_minmax(80px,1fr)_auto_36px] items-center gap-3 py-1 px-1.5 rounded-md hover:bg-muted/50 active:bg-muted/70 transition-colors text-left ${hasBudget ? "" : "opacity-55"}`}
                  >
                    <CategoryIcon
                      iconName={row.icon as CategoryIconName}
                      size={14}
                      color={row.color}
                    />
                    <span className="text-xs truncate">{row.name}</span>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${status.bar}`}
                        style={{
                          width: hasBudget
                            ? `${Math.min(100, row.pctUsed)}%`
                            : "0%",
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap text-right">
                      {formatCurrency(row.spent)}
                      {hasBudget && (
                        <span className="text-muted-foreground font-normal">
                          {" / "}
                          {formatCurrency(row.budgeted)}
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[11px] text-right tabular-nums ${status.text}`}
                    >
                      {hasBudget && Number.isFinite(row.pctUsed)
                        ? `${row.pctUsed.toFixed(0)}%`
                        : hasBudget
                          ? "—"
                          : ""}
                    </span>
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
