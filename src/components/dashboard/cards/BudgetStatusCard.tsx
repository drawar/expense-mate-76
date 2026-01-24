// components/dashboard/cards/BudgetStatusCard.tsx
/**
 * Hero card showing budget status with simple bullet chart
 * Simplified: one key metric (projection) with visual context
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  TargetIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  SettingsIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useBudget } from "@/hooks/useBudget";
import { calculateProjectedSpend } from "@/utils/dashboard/insightGenerator";
import { CurrencyService } from "@/core/currency/CurrencyService";

interface BudgetStatusCardProps {
  className?: string;
}

const BudgetStatusCard: React.FC<BudgetStatusCardProps> = ({
  className = "",
}) => {
  const {
    dashboardData,
    displayCurrency,
    activeTab,
    previousPeriodTransactions,
  } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Budget from Supabase with timeframe scaling
  const { scaledBudget, isLoading } = useBudget(displayCurrency, activeTab);

  // Calculate metrics
  const metrics = dashboardData?.metrics || {
    totalExpenses: 0,
    totalReimbursed: 0,
  };
  const netExpenses =
    (metrics.totalExpenses || 0) - (metrics.totalReimbursed || 0);

  // Calculate previous period spending for comparison
  const previousSpend = useMemo(() => {
    if (
      !previousPeriodTransactions ||
      previousPeriodTransactions.length === 0
    ) {
      return 0;
    }
    let total = 0;
    let reimbursed = 0;
    previousPeriodTransactions.forEach((tx) => {
      if (tx.amount > 0) {
        const amount = CurrencyService.convert(
          tx.paymentAmount ?? tx.amount,
          tx.paymentCurrency ?? tx.currency,
          displayCurrency
        );
        total += amount;
        if (tx.reimbursementAmount && tx.reimbursementAmount > 0) {
          reimbursed += CurrencyService.convert(
            tx.reimbursementAmount,
            tx.paymentCurrency ?? tx.currency,
            displayCurrency
          );
        }
      }
    });
    return total - reimbursed;
  }, [previousPeriodTransactions, displayCurrency]);

  // Calculate percentage change vs previous period
  const percentageChange = useMemo(() => {
    if (previousSpend === 0) return 0;
    return ((netExpenses - previousSpend) / previousSpend) * 100;
  }, [netExpenses, previousSpend]);

  // Period comparison helpers
  const isUp = percentageChange > 2;
  const isDown = percentageChange < -2;
  const getPeriodLabel = () => {
    switch (activeTab) {
      case "thisMonth":
        return "vs last month";
      case "lastMonth":
        return "vs 2 months ago";
      case "lastTwoMonths":
        return "vs prior 2 months";
      case "lastThreeMonths":
        return "vs prior 3 months";
      case "lastSixMonths":
        return "vs prior 6 months";
      case "thisYear":
        return "vs last year";
      default:
        return "vs last period";
    }
  };

  // Calculate days info
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;
  const daysElapsed = dayOfMonth;

  // Calculate expected spend at this point in the month
  const expectedSpend =
    scaledBudget > 0 ? scaledBudget * (daysElapsed / daysInMonth) : 0;

  // Calculate projected month-end spending
  const projectedSpend = useMemo(() => {
    return calculateProjectedSpend(netExpenses, daysElapsed, daysInMonth);
  }, [netExpenses, daysElapsed, daysInMonth]);

  // Status calculations
  const isOverBudget = netExpenses > scaledBudget;
  const projectedOverBudget = projectedSpend > scaledBudget;
  const projectedOverAmount = projectedSpend - scaledBudget;
  const projectedSavings = scaledBudget - projectedSpend;

  // Chart calculations - scale to max(budget, spending)
  const maxScale = Math.max(scaledBudget, netExpenses);
  const budgetPercent = maxScale > 0 ? (scaledBudget / maxScale) * 100 : 100;
  const spendPercent = maxScale > 0 ? (netExpenses / maxScale) * 100 : 0;
  const expectedPercent = maxScale > 0 ? (expectedSpend / maxScale) * 100 : 0;

  // Status text color
  const getStatusColor = () => {
    if (isOverBudget) return "text-red-600 dark:text-red-400";
    if (projectedOverBudget) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  // Spend bar color
  const getSpendBarColor = () => {
    if (isOverBudget) return "bg-red-400 dark:bg-red-500";
    return "bg-emerald-400 dark:bg-emerald-500";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <TargetIcon className="h-5 w-5 text-primary" />
            Budget Status
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {daysRemaining} days left
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Loading budget...
            </div>
          </div>
        ) : scaledBudget === 0 ? (
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-semibold tracking-tight">
                {formatCurrency(netExpenses)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                spent this period
              </p>
            </div>
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <SettingsIcon className="h-4 w-4" />
              Set budget in Settings
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Spend amount - the one key number */}
            <div>
              <span className="text-3xl font-semibold">
                {formatCurrency(netExpenses)}
              </span>
              <span className="text-muted-foreground ml-2">
                of {formatCurrency(scaledBudget)}
              </span>
            </div>

            {/* Custom bullet chart */}
            <div className="relative h-10">
              {/* Budget zone - scales to show budget vs max */}
              <div
                className="absolute top-1 h-8 bg-zinc-300 dark:bg-zinc-600 rounded"
                style={{ width: `${budgetPercent}%` }}
              />

              {/* Actual spending bar (thinner, centered) */}
              <div
                className={`absolute top-3 h-4 rounded ${getSpendBarColor()}`}
                style={{ width: `${spendPercent}%` }}
              />

              {/* Expected marker line */}
              <div
                className="absolute top-0 h-10 w-0.5 bg-foreground/80 rounded"
                style={{ left: `${expectedPercent}%` }}
              />
            </div>

            {/* Single insight line */}
            <p className={`text-sm ${getStatusColor()}`}>
              {isOverBudget ? (
                <>Over budget by {formatCurrency(netExpenses - scaledBudget)}</>
              ) : projectedOverBudget ? (
                <>
                  Projected {formatCurrency(projectedOverAmount)} over by month
                  end
                </>
              ) : (
                <>On track to save {formatCurrency(projectedSavings)}</>
              )}
            </p>

            {/* Period comparison - show dollar variance */}
            {previousSpend > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground pt-1">
                {isUp ? (
                  <TrendingUpIcon className="h-3.5 w-3.5 text-red-500" />
                ) : isDown ? (
                  <TrendingDownIcon className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <MinusIcon className="h-3.5 w-3.5" />
                )}
                <span
                  className={
                    isUp
                      ? "text-red-600 dark:text-red-400"
                      : isDown
                        ? "text-emerald-600 dark:text-emerald-400"
                        : ""
                  }
                >
                  {formatCurrency(Math.abs(netExpenses - previousSpend))}{" "}
                  {isUp ? "more" : isDown ? "less" : "same"}
                </span>
                <span>{getPeriodLabel()}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(BudgetStatusCard);
