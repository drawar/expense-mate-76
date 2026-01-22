// components/dashboard/cards/BudgetSpendingCardDesktop.tsx
/**
 * Desktop-optimized Budget + Spending Card
 * Features horizontal category layout to maximize space usage
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TargetIcon, PencilIcon, CheckIcon, XIcon } from "lucide-react";
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
        {/* Two-column layout: Budget on left, Categories on right */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Budget Summary (5 cols) */}
          <div className="col-span-5 border-r border-border/50 pr-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-muted-foreground">
                  Loading budget...
                </div>
              </div>
            ) : isEditing ? (
              <div className="space-y-3">
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : scaledBudget === 0 ? (
              <div>
                <div className="mb-4">
                  <p className="text-4xl font-semibold tracking-tight">
                    {formatCurrency(netExpenses)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    total spent
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{daysRemaining} days left this month</span>
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
              <div className="flex items-center gap-6">
                {/* Circular progress gauge */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="relative w-28 h-28 flex-shrink-0 cursor-default">
                        <svg
                          className="w-full h-full -rotate-90"
                          viewBox="0 0 100 100"
                        >
                          {/* Background circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-muted/30"
                          />
                          {/* Progress circle */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            strokeWidth="8"
                            strokeLinecap="round"
                            className={getProgressColor().replace(
                              "bg-",
                              "text-"
                            )}
                            style={{
                              strokeDasharray: `${Math.min(progress, 100) * 2.64} 264`,
                              transition: "stroke-dasharray 0.5s ease",
                            }}
                            stroke="currentColor"
                          />
                          {/* Expected progress marker */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            strokeWidth="2"
                            strokeDasharray="2 262"
                            className="text-foreground/40"
                            stroke="currentColor"
                            style={{
                              transform: `rotate(${expectedProgress * 3.6}deg)`,
                              transformOrigin: "center",
                            }}
                          />
                        </svg>
                        {/* Center text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-semibold">
                            {Math.round(progress)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            used
                          </span>
                        </div>
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

                {/* Budget details */}
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-3xl font-semibold tracking-tight">
                      {formatCurrency(netExpenses)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of {formatCurrency(scaledBudget)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span className={`text-sm font-medium ${getStatusColor()}`}>
                      {getStatusText()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {daysRemaining} days left
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Top Categories - Horizontal Bar Chart (7 cols) */}
          <div className="col-span-7">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Top Categories
            </p>

            {displayCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No spending data
              </p>
            ) : (
              <div className="space-y-2">
                {displayCategories.map((category: ParentCategorySpending) => (
                  <TooltipProvider key={category.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleCategoryClick(category)}
                          className="w-full flex items-center gap-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                        >
                          {/* Icon + Name */}
                          <div className="flex items-center gap-2 w-32 flex-shrink-0">
                            <CategoryIcon
                              iconName={category.icon as CategoryIconName}
                              size={16}
                              className="text-muted-foreground group-hover:text-foreground transition-colors"
                            />
                            <span className="text-sm truncate">
                              {category.name}
                            </span>
                          </div>

                          {/* Bar */}
                          <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
                            <div
                              className="h-full rounded transition-all duration-300"
                              style={{
                                width: `${category.percentage}%`,
                                backgroundColor: category.color,
                                opacity: 0.8,
                              }}
                            />
                          </div>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p className="font-medium">
                          {formatCurrency(category.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {category.percentage.toFixed(0)}% of spending
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(BudgetSpendingCardDesktop);
