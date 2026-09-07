// components/dashboard/cards/BudgetSpendingCard.tsx
/**
 * Pay-period Budget & Spending card — the primary spent-vs-budgeted surface.
 *
 * Reads the active budget_periods row via useActiveBudgetPeriod (grace
 * window: +3 days after period_end). Renders six parent-category rows in
 * canonical order with two-tone progress bars: green ≤ 80%, amber 80–100%,
 * red > 100%. When no active period exists, shows an empty-state banner
 * pointing at /income so the user can add a salary.
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

function statusColor(pctUsed: number): {
  bar: string;
  text: string;
} {
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
    remainingToSpend,
    totalBudgeted,
    totalSpent,
    isInGracePeriod,
    isLoading,
  } = useActiveBudgetPeriod(displayCurrency, transactions);

  const overallStatus = statusColor(
    totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
  );

  // Sort: rows with budgeted > 0 first (in canonical PARENT_CATEGORIES order,
  // already preserved by useActiveBudgetPeriod); zero-budget rows to the end.
  const orderedAllocations = React.useMemo<AllocationLine[]>(() => {
    const withBudget = allocations.filter((a) => a.budgeted > 0);
    const withoutBudget = allocations.filter((a) => a.budgeted === 0);
    return [...withBudget, ...withoutBudget];
  }, [allocations]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <TargetIcon className="h-5 w-5 text-primary" />
          Budget & Spending
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-pulse text-muted-foreground">
              Loading budget...
            </div>
          </div>
        ) : !period ? (
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              No active pay-period budget. Add an income named
              &quot;Salary&quot; or &quot;Paycheck&quot; to activate one.
            </p>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/income">Add Salary</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Pay-yourself-first: savings comes off the top */}
            {savingsBudgeted > 0 && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-[var(--color-accent-subtle)] px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <PiggyBankIcon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: "var(--color-success)" }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Save first
                    </p>
                    <p className="text-sm font-medium truncate">
                      {formatCurrency(savingsBudgeted)} set aside from{" "}
                      {formatCurrency(period.salary_amount)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  Ends {format(parseISO(period.period_end), "MMM d")}
                  {isInGracePeriod ? " (in grace)" : ""}
                </p>
              </div>
            )}

            {/* Header — spent vs remaining-to-spend for the period */}
            <div className="space-y-3 mb-4">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-medium tracking-tight">
                    {formatCurrency(totalSpent)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    of {formatCurrency(totalBudgeted)} to spend
                    {remainingToSpend !== totalBudgeted && (
                      <>
                        {" "}
                        ({formatCurrency(remainingToSpend)} remaining after
                        savings)
                      </>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${overallStatus.text}`}>
                    {totalSpent > totalBudgeted
                      ? "Over budget"
                      : totalSpent / (totalBudgeted || 1) >= 0.8
                        ? "Nearing limit"
                        : "On track"}
                  </p>
                  {savingsBudgeted === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Ends {format(parseISO(period.period_end), "MMM d")}
                      {isInGracePeriod ? " (in grace)" : ""}
                    </p>
                  )}
                </div>
              </div>
              <Progress
                value={
                  totalBudgeted > 0
                    ? Math.min(100, (totalSpent / totalBudgeted) * 100)
                    : 0
                }
                className="h-2"
                indicatorClassName={overallStatus.bar}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border/50 my-4" />

            {/* Per-parent breakdown */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                By Category
              </p>
              <div className="space-y-2">
                {orderedAllocations.map((row) => {
                  const status = statusColor(row.pctUsed);
                  const hasBudget = row.budgeted > 0;
                  return (
                    <button
                      key={row.parentId}
                      type="button"
                      onClick={() => {
                        onCategoryClick?.(row.parentId, row.name);
                        // Deep-link to Transactions filtered by parent id
                        // — subcategory list per parent lives in the app's
                        // existing filter code; keep the URL simple here.
                        const params = new URLSearchParams();
                        params.set("parent", row.parentId);
                        navigate(`/transactions?${params.toString()}`);
                      }}
                      className={`w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 active:bg-muted/70 transition-colors text-left ${hasBudget ? "" : "opacity-60"}`}
                    >
                      <CategoryIcon
                        iconName={row.icon as CategoryIconName}
                        size={18}
                        color={row.color}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm truncate">{row.name}</span>
                          <span className="text-sm font-medium">
                            {formatCurrency(row.spent)}
                            {hasBudget && (
                              <span className="text-muted-foreground">
                                {" "}
                                of {formatCurrency(row.budgeted)}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${status.bar}`}
                            style={{
                              width: hasBudget
                                ? `${Math.min(100, row.pctUsed)}%`
                                : "0%",
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-xs w-14 text-right ${status.text}`}
                      >
                        {hasBudget && Number.isFinite(row.pctUsed)
                          ? `${row.pctUsed.toFixed(0)}%`
                          : hasBudget
                            ? "—"
                            : "0%"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(BudgetSpendingCard);
