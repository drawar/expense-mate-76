// components/dashboard/cards/BudgetSpendingCardDesktop.tsx
/**
 * Desktop-optimized Budget + Spending Card
 * Features horizontal category layout to maximize space usage
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TargetIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useBudget, BudgetPeriodType } from "@/hooks/useBudget";
import { Transaction } from "@/types";
import {
  buildCategoryHierarchy,
  ParentCategorySpending,
} from "@/utils/dashboard/categoryHierarchy";
import { getTimeframeDateRange } from "@/utils/dashboard";
import { CategoryIcon, type CategoryIconName } from "@/utils/constants/icons";

interface BudgetSpendingCardDesktopProps {
  className?: string;
  transactions?: Transaction[];
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
}

/**
 * Desktop version with horizontal category bars
 */
const BudgetSpendingCardDesktop: React.FC<BudgetSpendingCardDesktopProps> = ({
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

  // Get top 4 categories for horizontal display
  const displayCategories = useMemo(() => {
    return hierarchyData.categories.slice(0, 4);
  }, [hierarchyData]);

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

  // Navigate to category transactions
  const handleCategoryClick = (category: ParentCategorySpending) => {
    const dateRange = getTimeframeDateRange(activeTab);
    const params = new URLSearchParams();
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

            {/* Progress bar with tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative cursor-default">
                    <Progress
                      value={Math.min(progress, 100)}
                      className="h-2"
                      indicatorClassName={getProgressColor()}
                    />
                    <div
                      className="absolute top-0 h-2 w-0.5 bg-gray-400 dark:bg-gray-500"
                      style={{ left: `${Math.min(expectedProgress, 100)}%` }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isOverBudget
                      ? `${formatCurrency(Math.abs(remaining))} over budget`
                      : `${formatCurrency(remaining)} remaining${daysRemaining > 0 ? ` (${formatCurrency(remaining / daysRemaining)}/day)` : ""}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border/50 my-4" />

        {/* Top Categories Section - Horizontal Layout */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Top Categories
          </p>

          {displayCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No spending data
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {displayCategories.map((category: ParentCategorySpending) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="flex flex-col p-3 rounded-lg hover:bg-muted/50 active:bg-muted/70 transition-colors text-left border border-border/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIcon
                      iconName={category.icon as CategoryIconName}
                      size={16}
                    />
                    <span className="text-sm font-medium truncate">
                      {category.name}
                    </span>
                  </div>
                  <p className="text-lg font-semibold">
                    {formatCurrency(category.amount)}
                  </p>
                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, category.percentage)}%`,
                        backgroundColor: category.color,
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {category.percentage.toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(BudgetSpendingCardDesktop);
