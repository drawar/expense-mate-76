/**
 * CategoryDrilldownSheet - Detailed view of spending in a category
 *
 * Shows transaction list, trends, and insights for a specific category.
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Transaction, Currency } from "@/types";
import { CurrencyService } from "@/core/currency";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import {
  getCategoryIcon,
  getCategoryColor,
  getParentCategory,
} from "@/utils/constants/categories";
import { CategoryIcon, type CategoryIconName } from "@/utils/constants/icons";
import { format, parseISO } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryDrilldownSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  transactions: Transaction[];
  previousPeriodTransactions?: Transaction[];
  currency?: Currency;
}

/**
 * Transaction row in the drill-down view
 */
const TransactionRow: React.FC<{
  transaction: Transaction;
  currency: Currency;
}> = ({ transaction, currency }) => {
  const dateStr =
    typeof transaction.date === "string"
      ? transaction.date
      : transaction.date.toISOString();

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {transaction.merchant.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {format(parseISO(dateStr), "MMM d, yyyy")}
          {transaction.paymentMethod && (
            <span className="ml-2">via {transaction.paymentMethod.name}</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium text-sm">
          {CurrencyService.format(transaction.amount, currency)}
        </div>
        {transaction.rewardPoints !== 0 && (
          <div
            className={`text-xs ${transaction.rewardPoints < 0 ? "text-destructive" : "text-[var(--color-success)]"}`}
          >
            {transaction.rewardPoints > 0 ? "+" : ""}
            {transaction.rewardPoints.toLocaleString()}{" "}
            {transaction.paymentMethod?.pointsCurrency || "pts"}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Main CategoryDrilldownSheet component
 */
const CategoryDrilldownSheet: React.FC<CategoryDrilldownSheetProps> = ({
  open,
  onOpenChange,
  categoryName,
  transactions,
  previousPeriodTransactions = [],
  currency = "SGD",
}) => {
  // Filter transactions for this category
  const categoryTransactions = useMemo(() => {
    return transactions
      .filter((tx) => getEffectiveCategory(tx) === categoryName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, categoryName]);

  // Calculate totals
  const currentTotal = useMemo(() => {
    return categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [categoryTransactions]);

  const previousTotal = useMemo(() => {
    return previousPeriodTransactions
      .filter((tx) => getEffectiveCategory(tx) === categoryName)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [previousPeriodTransactions, categoryName]);

  // Calculate change
  const change = currentTotal - previousTotal;
  const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

  // Get category metadata
  const iconName = getCategoryIcon(categoryName);
  const color = getCategoryColor(categoryName);
  const parentCategory = getParentCategory(categoryName);

  // Top merchants in this category
  const topMerchants = useMemo(() => {
    const merchantMap = new Map<string, { total: number; count: number }>();

    categoryTransactions.forEach((tx) => {
      const name = tx.merchant.name;
      const existing = merchantMap.get(name) || { total: 0, count: 0 };
      merchantMap.set(name, {
        total: existing.total + tx.amount,
        count: existing.count + 1,
      });
    });

    return Array.from(merchantMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [categoryTransactions]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-4">
          {/* Category header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CategoryIcon
                  iconName={iconName as CategoryIconName}
                  size={28}
                />
                <SheetTitle className="text-xl">{categoryName}</SheetTitle>
              </div>
              {parentCategory && (
                <Badge
                  variant="outline"
                  className="mt-1"
                  style={{
                    borderColor: parentCategory.color,
                    color: parentCategory.color,
                  }}
                >
                  {parentCategory.name}
                </Badge>
              )}
            </div>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm text-muted-foreground">This Period</div>
              <div className="text-2xl font-medium">
                {CurrencyService.format(currentTotal, currency)}
              </div>
              <div className="text-xs text-muted-foreground">
                {categoryTransactions.length} transaction
                {categoryTransactions.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                vs Last Period
              </div>
              <div
                className={cn(
                  "text-lg font-medium flex items-center gap-1",
                  change > 0
                    ? "text-[var(--color-error)]"
                    : "text-[var(--color-success)]"
                )}
              >
                {change > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                {change > 0 ? "+" : ""}
                {CurrencyService.format(Math.abs(change), currency)}
              </div>
              <div className="text-xs text-muted-foreground">
                {changePercent > 0 ? "+" : ""}
                {changePercent.toFixed(1)}% change
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Top merchants */}
          {topMerchants.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Top Merchants</h3>
              <div className="space-y-2">
                {topMerchants.map((merchant) => (
                  <div
                    key={merchant.name}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                  >
                    <div>
                      <div className="font-medium text-sm">{merchant.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {merchant.count} transaction
                        {merchant.count !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="font-medium text-sm">
                      {CurrencyService.format(merchant.total, currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent transactions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Recent Transactions</h3>
              <Link
                to={`/transactions?category=${encodeURIComponent(categoryName)}`}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                View all
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            {categoryTransactions.length > 0 ? (
              <div className="space-y-0">
                {categoryTransactions.slice(0, 10).map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    currency={currency}
                  />
                ))}
                {categoryTransactions.length > 10 && (
                  <div className="pt-2 text-center">
                    <Link
                      to={`/transactions?category=${encodeURIComponent(categoryName)}`}
                    >
                      <Button variant="ghost" size="sm">
                        View all {categoryTransactions.length} transactions
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No transactions in this category
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CategoryDrilldownSheet;
