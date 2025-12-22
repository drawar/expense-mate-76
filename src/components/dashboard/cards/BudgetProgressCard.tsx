// components/dashboard/cards/BudgetProgressCard.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  TargetIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  LightbulbIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { Transaction } from "@/types";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import { getSpendingTier } from "@/utils/constants/categories";

const BUDGET_STORAGE_KEY = "expense-mate-monthly-budget";

// Categories that are typically discretionary and can be cut
const DISCRETIONARY_CATEGORIES = [
  "Food & Drinks",
  "Shopping",
  "Entertainment",
  "Travel",
];

interface BudgetProgressCardProps {
  className?: string;
  transactions?: Transaction[];
}

/**
 * Card component that displays budget progress with editable monthly budget
 */
const BudgetProgressCard: React.FC<BudgetProgressCardProps> = ({
  className = "",
  transactions = [],
}) => {
  const { dashboardData, displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Budget state
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  // Load budget from localStorage on mount
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

  // Calculate expected progress based on days elapsed
  const expectedProgress = (dayOfMonth / daysInMonth) * 100;
  const isOnTrack = progress <= expectedProgress + 10; // 10% buffer

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
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Calculate recovery suggestions when over budget
  const recoverySuggestions = useMemo(() => {
    if (!isOverBudget || transactions.length === 0) return [];

    // Calculate spending by category
    const categorySpending: Record<string, number> = {};
    transactions.forEach((tx) => {
      const category = getEffectiveCategory(tx);
      categorySpending[category] =
        (categorySpending[category] || 0) + tx.amount;
    });

    // Find discretionary categories that can be cut
    const suggestions: {
      category: string;
      amount: number;
      suggestion: string;
    }[] = [];
    const overAmount = Math.abs(remaining);

    DISCRETIONARY_CATEGORIES.forEach((category) => {
      const spent = categorySpending[category] || 0;
      if (spent > 0) {
        // Suggest cutting 50% of discretionary spending
        const cutAmount = Math.min(spent * 0.5, overAmount);
        if (cutAmount >= 10) {
          let suggestion = "";
          if (category === "Food & Drinks") {
            suggestion = "Cook at home more";
          } else if (category === "Shopping") {
            suggestion = "Pause non-essential purchases";
          } else if (category === "Entertainment") {
            suggestion = "Try free activities";
          } else if (category === "Travel") {
            suggestion = "Postpone trips";
          }
          suggestions.push({ category, amount: cutAmount, suggestion });
        }
      }
    });

    // Sort by potential savings and take top 3
    return suggestions.sort((a, b) => b.amount - a.amount).slice(0, 3);
  }, [isOverBudget, transactions, remaining]);

  // Determine status color
  const getStatusColor = () => {
    if (isOverBudget) return "text-red-600 dark:text-red-400";
    if (!isOnTrack) return "text-amber-600 dark:text-amber-400";
    return "text-green-600 dark:text-green-400";
  };

  const getProgressColor = () => {
    if (isOverBudget) return "bg-red-500";
    if (!isOnTrack) return "bg-amber-500";
    return "bg-green-500";
  };

  const getStatusText = () => {
    if (isOverBudget) return "Over budget";
    if (!isOnTrack) return "Ahead of pace";
    return "On track";
  };

  // No budget set - show setup prompt
  if (monthlyBudget === 0 && !isEditing) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <TargetIcon className="h-5 w-5 text-primary" />
            Budget Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Set a monthly budget to track your spending
            </p>
            <Button size="sm" onClick={handleStartEdit}>
              Set Budget
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <TargetIcon className="h-5 w-5 text-primary" />
            Budget Progress
          </CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleStartEdit}
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="flex items-center gap-2">
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
        ) : (
          <div className="space-y-3">
            {/* Main progress display */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(netExpenses)}
                </p>
                <p className="text-xs text-muted-foreground">
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
              {/* Expected progress marker */}
              <div
                className="absolute top-0 h-2 w-0.5 bg-gray-400 dark:bg-gray-500"
                style={{ left: `${Math.min(expectedProgress, 100)}%` }}
                title={`Expected: ${expectedProgress.toFixed(0)}%`}
              />
            </div>

            {/* Remaining amount */}
            <div className="text-xs text-muted-foreground">
              {isOverBudget ? (
                <span className="text-red-600 dark:text-red-400">
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

            {/* Recovery suggestions when over budget */}
            {isOverBudget && recoverySuggestions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                  <LightbulbIcon className="h-3.5 w-3.5" />
                  How to recover:
                </div>
                <div className="space-y-1.5">
                  {recoverySuggestions.map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {item.suggestion}
                      </span>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Save {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(BudgetProgressCard);
