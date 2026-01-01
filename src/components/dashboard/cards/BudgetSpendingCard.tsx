// components/dashboard/cards/BudgetSpendingCard.tsx
/**
 * Unified Budget + Spending Card
 * Combines budget progress with top spending categories in a single card
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useBudget, BudgetPeriodType } from "@/hooks/useBudget";
import { Transaction } from "@/types";
import {
  buildCategoryHierarchy,
  ParentCategorySpending,
} from "@/utils/dashboard/categoryHierarchy";
import { getTimeframeDateRange } from "@/utils/dashboard";

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
  const navigate = useNavigate();
  const { dashboardData, displayCurrency, activeTab } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Budget from Supabase with timeframe scaling
  const { scaledBudget, rawBudget, periodType, isLoading, setBudget } =
    useBudget(displayCurrency, activeTab);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editPeriodType, setEditPeriodType] =
    useState<BudgetPeriodType>("monthly");
  const [showAllCategories, setShowAllCategories] = useState(false);

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

  // Calculate progress using scaled budget
  const progress = scaledBudget > 0 ? (netExpenses / scaledBudget) * 100 : 0;
  const remaining = scaledBudget - netExpenses;
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

  // Get period label for display
  const getPeriodLabel = () => {
    return periodType === "weekly" ? "weekly" : "monthly";
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <TargetIcon className="h-5 w-5 text-primary" />
            Budget & Spending
          </CardTitle>
          {!isEditing && scaledBudget > 0 && (
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
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-pulse text-muted-foreground">
              Loading budget...
            </div>
          </div>
        ) : isEditing ? (
          <div className="space-y-3 mb-4">
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
                  of {formatCurrency(scaledBudget)}
                  <span className="text-xs ml-1">
                    ({formatCurrency(rawBudget)}/{getPeriodLabel()})
                  </span>
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
                  onClick={() => {
                    // Navigate to transactions page with category and date filters
                    const dateRange = getTimeframeDateRange(activeTab);
                    const params = new URLSearchParams();
                    // Pass all subcategory names as comma-separated list
                    const subcategoryNames = category.subcategories
                      .map((sub) => sub.name)
                      .join(",");
                    params.set("category", subcategoryNames);
                    if (dateRange) {
                      params.set("from", dateRange.from);
                      params.set("to", dateRange.to);
                    }
                    navigate(`/transactions?${params.toString()}`);
                    onCategoryClick?.(category.id, category.name);
                  }}
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
