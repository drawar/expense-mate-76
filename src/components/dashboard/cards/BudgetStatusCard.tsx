// components/dashboard/cards/BudgetStatusCard.tsx
/**
 * Hero card showing budget status with simple bullet chart
 * Simplified: one key metric (projection) with visual context
 */

import React, { useState, useMemo } from "react";
import {
  TargetIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useBudget, BudgetPeriodType } from "@/hooks/useBudget";
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
  const { scaledBudget, rawBudget, periodType, isLoading, setBudget } =
    useBudget(displayCurrency, activeTab);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editPeriodType, setEditPeriodType] =
    useState<BudgetPeriodType>("monthly");

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

  // Save budget to Supabase
  const saveBudget = async (
    amount: number,
    budgetPeriodType: BudgetPeriodType
  ) => {
    try {
      await setBudget(amount, displayCurrency, budgetPeriodType);
    } catch (error) {
      console.error("Failed to save budget:", error);
    }
  };

  // Handle edit
  const handleStartEdit = () => {
    setEditValue(rawBudget > 0 ? rawBudget.toString() : "");
    setEditPeriodType(periodType);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const amount = parseFloat(editValue);
    if (!isNaN(amount) && amount >= 0) {
      await saveBudget(amount, editPeriodType);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveEdit();
    else if (e.key === "Escape") handleCancelEdit();
  };

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
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {daysRemaining} days left
            </span>
            {!isEditing && scaledBudget > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleStartEdit}
                      aria-label="Edit budget"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit budget</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">
              Loading budget...
            </div>
          </div>
        ) : isEditing ? (
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter budget amount"
                className="h-9 flex-1"
                autoFocus
              />
              <Select
                value={editPeriodType}
                onValueChange={(value) =>
                  setEditPeriodType(value as BudgetPeriodType)
                }
              >
                <SelectTrigger className="w-28 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSaveEdit} className="flex-1">
                <CheckIcon className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <XIcon className="h-4 w-4" />
              </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              className="w-full max-w-xs"
            >
              Set Budget
            </Button>
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
