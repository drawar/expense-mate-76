// components/dashboard/cards/BudgetSpendingCard.tsx
/**
 * Unified Budget + Spending Card
 * Combines budget progress with top spending categories in a single card
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  TargetIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { Transaction } from "@/types";
import {
  buildCategoryHierarchy,
  ParentCategorySpending,
} from "@/utils/dashboard/categoryHierarchy";

const BUDGET_STORAGE_KEY = "clairo-monthly-budget";

interface BudgetSpendingCardProps {
  className?: string;
  transactions?: Transaction[];
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
}

/**
 * Unified card showing budget progress + top spending categories
 */
const BudgetSpendingCard: React.FC<BudgetSpendingCardProps> = ({
  className = "",
  transactions = [],
  onCategoryClick,
}) => {
  const { dashboardData, displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Budget state
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Load budget from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed[displayCurrency]) {
        setMonthlyBudget(parsed[displayCurrency]);
      }
    }
  }, [displayCurrency]);

  // Save budget to localStorage
  const saveBudget = (amount: number) => {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
    const budgets = stored ? JSON.parse(stored) : {};
    budgets[displayCurrency] = amount;
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
    setMonthlyBudget(amount);
  };

  // Calculate metrics
  const metrics = dashboardData?.metrics || {
    totalExpenses: 0,
    totalReimbursed: 0,
  };
  const netExpenses =
    (metrics.totalExpenses || 0) - (metrics.totalReimbursed || 0);

  // Calculate days info
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  // Calculate progress
  const progress = monthlyBudget > 0 ? (netExpenses / monthlyBudget) * 100 : 0;
  const remaining = monthlyBudget - netExpenses;
  const isOverBudget = remaining < 0;
  const expectedProgress = (dayOfMonth / daysInMonth) * 100;
  const isOnTrack = progress <= expectedProgress + 10;

  // Build category hierarchy
  const hierarchyData = useMemo(
    () => buildCategoryHierarchy(transactions, displayCurrency),
    [transactions, displayCurrency]
  );

  // Get top 3 categories (or all if expanded)
  const displayCategories = useMemo(() => {
    const maxShow = showAllCategories ? 6 : 3;
    return hierarchyData.categories.slice(0, maxShow);
  }, [hierarchyData, showAllCategories]);

  // Handle edit
  const handleStartEdit = () => {
    setEditValue(monthlyBudget > 0 ? monthlyBudget.toString() : "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const amount = parseFloat(editValue);
    if (!isNaN(amount) && amount >= 0) {
      saveBudget(amount);
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

  // Status colors
  const getStatusColor = () => {
    if (isOverBudget) return "text-[var(--color-error)]";
    if (!isOnTrack) return "text-[var(--color-warning)]";
    return "text-[var(--color-success)]";
  };

  const getProgressColor = () => {
    if (isOverBudget) return "bg-[var(--color-error)]";
    if (!isOnTrack) return "bg-[var(--color-warning)]";
    return "bg-[var(--color-success)]";
  };

  const getStatusText = () => {
    if (isOverBudget) return "Over budget";
    if (!isOnTrack) return "Ahead of pace";
    return "On track";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <TargetIcon className="h-5 w-5 text-primary" />
            Budget & Spending
          </CardTitle>
          {!isEditing && monthlyBudget > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-11 w-11 p-0 -mr-2"
              onClick={handleStartEdit}
              aria-label="Edit budget"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Budget Section */}
        {isEditing ? (
          <div className="flex items-center gap-2 mb-4">
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter monthly budget"
              className="h-9"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
              <CheckIcon className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : monthlyBudget === 0 ? (
          <div className="mb-4">
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-3xl font-medium tracking-tight">
                  {formatCurrency(netExpenses)}
                </p>
                <p className="text-sm text-muted-foreground">total spent</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {daysRemaining} days left
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartEdit}
              className="w-full"
            >
              Set Budget
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {/* Main progress display */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-medium tracking-tight">
                  {formatCurrency(netExpenses)}
                </p>
                <p className="text-sm text-muted-foreground">
                  of {formatCurrency(monthlyBudget)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {daysRemaining} days left
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative">
              <Progress
                value={Math.min(progress, 100)}
                className="h-2"
                indicatorClassName={getProgressColor()}
              />
              <div
                className="absolute top-0 h-2 w-0.5 bg-gray-400 dark:bg-gray-500"
                style={{ left: `${Math.min(expectedProgress, 100)}%` }}
                title={`Expected: ${expectedProgress.toFixed(0)}%`}
              />
            </div>

            {/* Remaining amount */}
            <div className="text-xs text-muted-foreground">
              {isOverBudget ? (
                <span className="text-[var(--color-error)]">
                  {formatCurrency(Math.abs(remaining))} over budget
                </span>
              ) : (
                <span>
                  {formatCurrency(remaining)} remaining
                  {daysRemaining > 0 && (
                    <span className="ml-1">
                      ({formatCurrency(remaining / daysRemaining)}/day)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border/50 my-4" />

        {/* Top Categories Section */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Top Categories
          </p>

          {displayCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No spending data
            </p>
          ) : (
            <div className="space-y-2">
              {displayCategories.map((category: ParentCategorySpending) => (
                <button
                  key={category.id}
                  onClick={() => onCategoryClick?.(category.id, category.name)}
                  className="w-full flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 active:bg-muted/70 transition-colors text-left"
                >
                  <span className="text-base">{category.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm truncate">{category.name}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(category.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, category.percentage)}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {category.percentage.toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Show more/less toggle */}
          {hierarchyData.categories.length > 3 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="w-full flex items-center justify-center gap-1 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {showAllCategories ? (
                <>
                  Show less
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show {Math.min(hierarchyData.categories.length - 3, 3)} more
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(BudgetSpendingCard);
