/**
 * SpendingBreakdownCard - Hierarchical category spending view
 *
 * Displays spending by parent category with expandable subcategories,
 * progress bars, and percentage breakdowns.
 */

import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Transaction, Currency } from "@/types";
import { CurrencyService } from "@/core/currency";
import {
  buildCategoryHierarchy,
  ParentCategorySpending,
  SubcategorySpending,
} from "@/utils/dashboard/categoryHierarchy";
import { cn } from "@/lib/utils";

interface SpendingBreakdownCardProps {
  transactions: Transaction[];
  currency?: Currency;
  className?: string;
  onCategoryClick?: (categoryId: string, categoryName: string) => void;
  maxCategories?: number;
}

/**
 * Progress bar component for spending visualization
 */
const ProgressBar: React.FC<{
  percentage: number;
  color: string;
  className?: string;
}> = ({ percentage, color, className }) => (
  <div
    className={cn(
      "h-2 w-full bg-muted rounded-full overflow-hidden",
      className
    )}
  >
    <div
      className="h-full rounded-full transition-all duration-300"
      style={{
        width: `${Math.min(100, percentage)}%`,
        backgroundColor: color,
      }}
    />
  </div>
);

/**
 * Subcategory row component
 */
const SubcategoryRow: React.FC<{
  subcategory: SubcategorySpending;
  parentColor: string;
  currency: Currency;
  onClick?: () => void;
}> = ({ subcategory, parentColor, currency, onClick }) => (
  <div
    className={cn(
      "flex items-center justify-between py-1.5 pl-6 pr-2 rounded-md",
      "hover:bg-muted/50 transition-colors",
      onClick && "cursor-pointer"
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <span className="text-sm">{subcategory.emoji}</span>
      <span className="text-sm text-muted-foreground truncate">
        {subcategory.name}
      </span>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">
        {subcategory.percentage.toFixed(0)}%
      </span>
      <span className="text-sm font-medium w-20 text-right">
        {CurrencyService.format(subcategory.amount, currency)}
      </span>
    </div>
  </div>
);

/**
 * Parent category row component with expand/collapse functionality
 */
const ParentCategoryRow: React.FC<{
  category: ParentCategorySpending;
  currency: Currency;
  isExpanded: boolean;
  onToggle: () => void;
  onSubcategoryClick?: (subcategoryName: string) => void;
}> = ({ category, currency, isExpanded, onToggle, onSubcategoryClick }) => {
  const hasSubcategories = category.subcategories.length > 0;

  return (
    <div className="space-y-1">
      {/* Parent category row */}
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-2 rounded-lg",
          "hover:bg-muted/50 transition-colors cursor-pointer"
        )}
        onClick={onToggle}
      >
        {/* Expand/collapse icon */}
        <div className="w-5 h-5 flex items-center justify-center">
          {hasSubcategories ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4" />
          )}
        </div>

        {/* Category info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-base">{category.emoji}</span>
              <span className="font-medium text-sm">{category.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {category.percentage.toFixed(0)}%
              </span>
              <span className="font-semibold text-sm w-24 text-right">
                {CurrencyService.format(category.amount, currency)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <ProgressBar
            percentage={category.percentage}
            color={category.color}
          />
        </div>
      </div>

      {/* Subcategories (expanded) */}
      {isExpanded && hasSubcategories && (
        <div className="ml-4 border-l-2 border-muted pl-2 space-y-0.5">
          {category.subcategories.map((sub) => (
            <SubcategoryRow
              key={sub.id}
              subcategory={sub}
              parentColor={category.color}
              currency={currency}
              onClick={
                onSubcategoryClick
                  ? () => onSubcategoryClick(sub.name)
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main SpendingBreakdownCard component
 */
const SpendingBreakdownCard: React.FC<SpendingBreakdownCardProps> = ({
  transactions,
  currency = "SGD",
  className = "",
  onCategoryClick,
  maxCategories = 6,
}) => {
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  // Build hierarchical data with currency conversion
  const hierarchyData = useMemo(
    () => buildCategoryHierarchy(transactions, currency),
    [transactions, currency]
  );

  // Get top categories (limit to maxCategories)
  const displayCategories = useMemo(() => {
    const categories = hierarchyData.categories.slice(0, maxCategories);

    // If there are more categories, add an "Other" summary
    if (hierarchyData.categories.length > maxCategories) {
      const otherCategories = hierarchyData.categories.slice(maxCategories);
      const otherTotal = otherCategories.reduce((sum, c) => sum + c.amount, 0);
      const otherPercentage =
        hierarchyData.totalSpending > 0
          ? (otherTotal / hierarchyData.totalSpending) * 100
          : 0;

      if (otherTotal > 0) {
        categories.push({
          id: "other",
          name: "Other",
          emoji: "📦",
          color: "#9e9e9e",
          amount: otherTotal,
          percentage: otherPercentage,
          subcategories: otherCategories.flatMap((c) =>
            c.subcategories.map((s) => ({
              ...s,
              percentage: otherTotal > 0 ? (s.amount / otherTotal) * 100 : 0,
            }))
          ),
          budgetPriority: "low",
          savingsPotential: "low",
        });
      }
    }

    return categories;
  }, [hierarchyData, maxCategories]);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Handle subcategory click
  const handleSubcategoryClick = (
    parentId: string,
    subcategoryName: string
  ) => {
    if (onCategoryClick) {
      onCategoryClick(parentId, subcategoryName);
    }
  };

  // Empty state
  if (displayCategories.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-36 text-muted-foreground">
            <p>No spending data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Spending Breakdown</CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {CurrencyService.format(hierarchyData.totalSpending, currency)}
            </div>
            <div className="text-xs text-muted-foreground">Total spending</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {displayCategories.map((category) => (
            <ParentCategoryRow
              key={category.id}
              category={category}
              currency={currency}
              isExpanded={expandedCategories.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
              onSubcategoryClick={(subName) =>
                handleSubcategoryClick(category.id, subName)
              }
            />
          ))}
        </div>

        {/* Legend for savings potential */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Essentials</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Lifestyle</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Home</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-pink-500" />
              <span>Personal</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendingBreakdownCard);
