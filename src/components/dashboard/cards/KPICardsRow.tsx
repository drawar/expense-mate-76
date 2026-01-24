// components/dashboard/cards/KPICardsRow.tsx
/**
 * KPI cards showing key metrics:
 * - IncomeSavingsStack: Total Income + Savings (stacked vertically)
 * - SecondaryKPICards: Largest Expense + Most Used Card (horizontal row)
 */

import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from "date-fns";
import { ArrowRightIcon, TriangleIcon, MinusIcon } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useRecurringIncome } from "@/hooks/useRecurringIncome";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { getCurrencySymbol } from "@/utils/currency";
import { getParentCategory } from "@/utils/constants/categories";

// Category colors matching the design palette
const CATEGORY_COLORS: Record<string, string> = {
  essentials: "#073B4C",
  lifestyle: "#FFD166",
  home_living: "#118AB2",
  personal_care: "#EF476F",
  work_education: "#06D6A0",
  financial_other: "#F78C6B",
};

interface KPICardsRowProps {
  className?: string;
}

/**
 * Income and Savings cards stacked vertically
 * Designed to sit alongside SpendingOverviewCard
 */
export const IncomeSavingsStack: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { displayCurrency, dashboardData, activeTab } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);
  const { totalIncome } = useRecurringIncome(displayCurrency, activeTab);

  const { totalSavings, savingsPercentage } = useMemo(() => {
    const netExpenses =
      (dashboardData?.metrics?.totalExpenses || 0) -
      (dashboardData?.metrics?.totalReimbursed || 0);
    const savings = totalIncome - netExpenses;
    const percentage =
      totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;
    return { totalSavings: savings, savingsPercentage: percentage };
  }, [totalIncome, dashboardData]);

  return (
    <div className={`flex flex-col gap-4 h-full ${className}`}>
      {/* Total Savings */}
      <Card className="bg-card border-border/50 flex-1">
        <CardContent className="pt-6 pb-4">
          <p className="text-sm text-muted-foreground text-center">
            {totalSavings >= 0 ? "You've saved" : "Over Budget"}
          </p>
          <p
            className={`text-4xl font-bold tracking-tight mt-1 text-center ${
              totalSavings >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            <NumberFlow
              value={totalSavings}
              format={{
                style: "currency",
                currency: displayCurrency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                signDisplay: "exceptZero",
              }}
            />
          </p>
          <p className="text-sm text-muted-foreground mt-3 text-center">
            that's
          </p>
          <p
            className={`text-7xl font-bold tracking-tight text-center my-1 ${
              totalSavings >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            <NumberFlow
              value={savingsPercentage}
              suffix="%"
              transformTiming={{ duration: 500 }}
            />
          </p>
          <p className="text-sm text-muted-foreground text-center mb-1">
            of income
          </p>
        </CardContent>
      </Card>

      {/* Total Income */}
      <Card className="bg-card border-border/50 flex-1">
        <CardContent className="pt-6 pb-4">
          <p className="text-sm text-muted-foreground text-center">
            You've earned
          </p>
          <p className="text-4xl font-semibold tracking-tight mt-1 text-center">
            <NumberFlow
              value={totalIncome}
              format={{
                style: "currency",
                currency: displayCurrency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </p>
          <Link
            to="/income"
            className="group flex items-center gap-1 text-sm text-primary mt-2"
          >
            <span className="relative">
              View payslips
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full" />
            </span>
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Category Insight Cards: Spike Driver + Top Category Share
 */
export const CategoryInsightCards: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const {
    filteredTransactions,
    previousPeriodTransactions,
    displayCurrency,
    activeTab,
  } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Calculate date range based on active time filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (activeTab) {
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "lastMonth":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case "lastTwoMonths":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(now);
        break;
      case "lastThreeMonths":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "lastSixMonths":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "thisYear":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return {
      from: format(start, "yyyy-MM-dd"),
      to: format(end, "yyyy-MM-dd"),
    };
  }, [activeTab]);

  // Calculate category spending for current and previous periods
  const categoryAnalysis = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return null;
    }

    // Helper to calculate category totals
    const calculateCategoryTotals = (
      transactions: typeof filteredTransactions
    ) => {
      const categoryTotals = new Map<
        string,
        { amount: number; name: string }
      >();
      const subcategoryTotals = new Map<
        string,
        { amount: number; name: string; parentId: string }
      >();

      transactions.forEach((tx) => {
        if (tx.amount <= 0) return;

        const grossAmount = CurrencyService.convert(
          tx.paymentAmount ?? tx.amount,
          tx.paymentCurrency ?? tx.currency,
          displayCurrency
        );
        const reimbursed = tx.reimbursementAmount
          ? CurrencyService.convert(
              tx.reimbursementAmount,
              tx.paymentCurrency ?? tx.currency,
              displayCurrency
            )
          : 0;
        const netAmount = grossAmount - reimbursed;

        const categoryName = tx.category || "Uncategorized";
        const parent = getParentCategory(categoryName);
        const parentId = parent?.id || "other";
        const parentName = parent?.name || "Other";

        // Aggregate by parent category
        const existing = categoryTotals.get(parentId);
        if (existing) {
          existing.amount += netAmount;
        } else {
          categoryTotals.set(parentId, { amount: netAmount, name: parentName });
        }

        // Aggregate by subcategory
        const subExisting = subcategoryTotals.get(categoryName);
        if (subExisting) {
          subExisting.amount += netAmount;
        } else {
          subcategoryTotals.set(categoryName, {
            amount: netAmount,
            name: categoryName,
            parentId,
          });
        }
      });

      return { categoryTotals, subcategoryTotals };
    };

    const current = calculateCategoryTotals(filteredTransactions);
    const previous = calculateCategoryTotals(previousPeriodTransactions || []);

    // Find category with biggest % increase
    let biggestSpike: {
      categoryName: string;
      categoryId: string;
      currentAmount: number;
      previousAmount: number;
      changePercent: number;
      changeAmount: number;
    } | null = null;

    let biggestDrop: typeof biggestSpike = null;

    current.categoryTotals.forEach((currentData, categoryId) => {
      const previousData = previous.categoryTotals.get(categoryId);
      const previousAmount = previousData?.amount || 0;
      const changeAmount = currentData.amount - previousAmount;
      const changePercent =
        previousAmount > 0
          ? (changeAmount / previousAmount) * 100
          : currentData.amount > 0
            ? 100
            : 0;

      if (
        changePercent > 10 &&
        (!biggestSpike || changePercent > biggestSpike.changePercent)
      ) {
        biggestSpike = {
          categoryName: currentData.name,
          categoryId,
          currentAmount: currentData.amount,
          previousAmount,
          changePercent,
          changeAmount,
        };
      }

      if (
        changePercent < -10 &&
        (!biggestDrop || changePercent < biggestDrop.changePercent)
      ) {
        biggestDrop = {
          categoryName: currentData.name,
          categoryId,
          currentAmount: currentData.amount,
          previousAmount,
          changePercent,
          changeAmount,
        };
      }
    });

    // Find top subcategory driving the spike (for spike card)
    let spikeSubcategory: { name: string; amount: number } | null = null;
    if (biggestSpike) {
      current.subcategoryTotals.forEach((subData) => {
        if (subData.parentId === biggestSpike!.categoryId) {
          if (!spikeSubcategory || subData.amount > spikeSubcategory.amount) {
            spikeSubcategory = { name: subData.name, amount: subData.amount };
          }
        }
      });
    }

    // Calculate total spending
    let totalSpending = 0;
    current.categoryTotals.forEach((data) => {
      totalSpending += data.amount;
    });

    // Find overall top subcategory and its parent
    let topSubcategory: {
      name: string;
      amount: number;
      parentId: string;
    } | null = null;
    current.subcategoryTotals.forEach((subData) => {
      if (!topSubcategory || subData.amount > topSubcategory.amount) {
        topSubcategory = {
          name: subData.name,
          amount: subData.amount,
          parentId: subData.parentId,
        };
      }
    });

    const topSubcategoryShare =
      topSubcategory && totalSpending > 0
        ? Math.round((topSubcategory.amount / totalSpending) * 100)
        : 0;

    return {
      biggestSpike,
      biggestDrop,
      spikeSubcategory,
      topSubcategory,
      topSubcategoryShare,
      totalSpending,
    };
  }, [filteredTransactions, previousPeriodTransactions, displayCurrency]);

  const biggestSpike = categoryAnalysis?.biggestSpike ?? null;
  const biggestDrop = categoryAnalysis?.biggestDrop ?? null;
  const spikeSubcategory = categoryAnalysis?.spikeSubcategory ?? null;
  const topSubcategory = categoryAnalysis?.topSubcategory ?? null;
  const actualTopSubcategoryShare = categoryAnalysis?.topSubcategoryShare ?? 0;

  // Animate from 0 on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const topSubcategoryShare = mounted ? actualTopSubcategoryShare : 0;

  return (
    <div className={`h-full ${className}`}>
      {/* Top Subcategory Share Card */}
      <Card className="bg-card border-border/50 h-full">
        <CardContent className="h-full flex flex-col justify-center py-6">
          <p className="text-sm text-muted-foreground text-center">
            You spent the most on
          </p>
          <p
            className="text-3xl font-semibold tracking-tight mt-1 text-center"
            style={{
              color: topSubcategory
                ? CATEGORY_COLORS[topSubcategory.parentId] || undefined
                : undefined,
            }}
          >
            {topSubcategory?.name || "-"}
          </p>
          {topSubcategory && (
            <p className="text-4xl font-bold tracking-tight mt-1 text-center">
              <NumberFlow
                value={topSubcategory.amount}
                format={{
                  style: "currency",
                  currency: displayCurrency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-3 text-center">
            that's
          </p>
          <p className="text-5xl font-bold tracking-tight text-center my-1">
            <NumberFlow
              value={topSubcategoryShare}
              suffix="%"
              transformTiming={{ duration: 500 }}
            />
          </p>
          <p className="text-sm text-muted-foreground text-center mb-1">
            of total spending
          </p>
          {topSubcategory && (
            <Link
              to={`/transactions?from=${dateRange.from}&to=${dateRange.to}&category=${encodeURIComponent(topSubcategory.name)}`}
              className="group flex items-center justify-center gap-1 text-sm text-primary mt-3"
            >
              <span className="relative">
                View {topSubcategory.name}
                <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full" />
              </span>
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Secondary KPI cards: Largest Expense and Most Used Card
 */
export const SecondaryKPICards: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { filteredTransactions, displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Find largest net expense
  const largestExpense = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return null;
    }

    let largest: {
      amount: number;
      merchantName: string;
    } | null = null;

    filteredTransactions.forEach((tx) => {
      if (tx.amount <= 0) return;

      const grossAmount = CurrencyService.convert(
        tx.paymentAmount ?? tx.amount,
        tx.paymentCurrency ?? tx.currency,
        displayCurrency
      );
      const reimbursed = tx.reimbursementAmount
        ? CurrencyService.convert(
            tx.reimbursementAmount,
            tx.paymentCurrency ?? tx.currency,
            displayCurrency
          )
        : 0;
      const netAmount = grossAmount - reimbursed;

      if (!largest || netAmount > largest.amount) {
        largest = {
          amount: netAmount,
          merchantName: tx.merchant?.name || "Unknown",
        };
      }
    });

    return largest;
  }, [filteredTransactions, displayCurrency]);

  // Find most used card
  const mostUsedCard = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return null;
    }

    const cardUsage = new Map<string, { count: number; name: string }>();

    filteredTransactions.forEach((tx) => {
      if (!tx.paymentMethod?.id) return;

      const pmId = tx.paymentMethod.id;
      const existing = cardUsage.get(pmId);
      if (existing) {
        existing.count++;
      } else {
        cardUsage.set(pmId, {
          count: 1,
          name:
            tx.paymentMethod.nickname ||
            tx.paymentMethod.name ||
            "Unknown Card",
        });
      }
    });

    let mostUsed: { name: string; count: number } | null = null;
    cardUsage.forEach((value) => {
      if (!mostUsed || value.count > mostUsed.count) {
        mostUsed = value;
      }
    });

    return mostUsed;
  }, [filteredTransactions]);

  const truncate = (str: string, maxLen: number) => {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen - 1) + "…";
  };

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {/* Largest Expense */}
      <Card className="bg-card border-border/50">
        <CardContent className="pt-6 pb-4">
          <p className="text-sm text-muted-foreground">Largest Expense</p>
          <p className="text-4xl font-semibold tracking-tight mt-1">
            {largestExpense ? (
              <NumberFlow
                value={largestExpense.amount}
                format={{
                  style: "currency",
                  currency: displayCurrency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
            ) : (
              "-"
            )}
          </p>
          {largestExpense && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {truncate(largestExpense.merchantName, 20)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Most Used Card */}
      <Card className="bg-card border-border/50">
        <CardContent className="pt-6 pb-4">
          <p className="text-sm text-muted-foreground">Most Used Card</p>
          <p className="text-4xl font-semibold tracking-tight mt-1 truncate">
            {mostUsedCard ? truncate(mostUsedCard.name, 16) : "-"}
          </p>
          {mostUsedCard && (
            <p className="text-xs text-muted-foreground">
              {mostUsedCard.count} transactions
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Most Frequent Merchant card
 */
export const MostFrequentMerchantCard: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { filteredTransactions, displayCurrency, activeTab } =
    useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Calculate date range based on active time filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (activeTab) {
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "lastMonth":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case "lastTwoMonths":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(now);
        break;
      case "lastThreeMonths":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "lastSixMonths":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "thisYear":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return {
      from: format(start, "yyyy-MM-dd"),
      to: format(end, "yyyy-MM-dd"),
    };
  }, [activeTab]);

  // Find most frequent merchant with total spend, average, and dominant category
  const mostFrequentMerchant = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return null;
    }

    const merchantData = new Map<
      string,
      {
        name: string;
        positiveCount: number;
        totalSpend: number;
        categoryCounts: Map<string, number>;
      }
    >();

    filteredTransactions.forEach((tx) => {
      if (!tx.merchant?.name) return;
      const merchantName = tx.merchant.name.trim();
      if (!merchantName || merchantName.toLowerCase() === "unknown") return;

      const existing = merchantData.get(merchantName);

      // Calculate net amount (gross - reimbursement)
      const grossAmount = CurrencyService.convert(
        tx.paymentAmount ?? tx.amount,
        tx.paymentCurrency ?? tx.currency,
        displayCurrency
      );
      const reimbursed = tx.reimbursementAmount
        ? CurrencyService.convert(
            tx.reimbursementAmount,
            tx.paymentCurrency ?? tx.currency,
            displayCurrency
          )
        : 0;
      const netAmount = grossAmount - reimbursed;

      // Only count positive transactions for frequency (negative = refunds/adjustments)
      const isPositive = tx.amount > 0;

      // Get parent category
      const categoryName = tx.category || "Uncategorized";
      const parent = getParentCategory(categoryName);
      const parentId = parent?.id || "other";

      if (existing) {
        if (isPositive) existing.positiveCount++;
        existing.totalSpend += netAmount;
        existing.categoryCounts.set(
          parentId,
          (existing.categoryCounts.get(parentId) || 0) + 1
        );
      } else {
        const categoryCounts = new Map<string, number>();
        categoryCounts.set(parentId, 1);
        merchantData.set(merchantName, {
          name: merchantName,
          positiveCount: isPositive ? 1 : 0,
          totalSpend: netAmount,
          categoryCounts,
        });
      }
    });

    let mostFrequent: {
      name: string;
      count: number;
      totalSpend: number;
      averageSpend: number;
      parentCategoryId: string;
    } | null = null;

    merchantData.forEach((value) => {
      if (!mostFrequent || value.positiveCount > mostFrequent.count) {
        // Find dominant category
        let dominantCategory = "other";
        let maxCount = 0;
        value.categoryCounts.forEach((count, categoryId) => {
          if (count > maxCount) {
            maxCount = count;
            dominantCategory = categoryId;
          }
        });

        mostFrequent = {
          name: value.name,
          count: value.positiveCount,
          totalSpend: value.totalSpend,
          averageSpend:
            value.positiveCount > 0
              ? value.totalSpend / value.positiveCount
              : 0,
          parentCategoryId: dominantCategory,
        };
      }
    });

    return mostFrequent;
  }, [filteredTransactions, displayCurrency]);

  // Animate from 0 on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const visitCount = mounted ? mostFrequentMerchant?.count || 0 : 0;

  return (
    <Card className={`bg-card border-border/50 h-full ${className}`}>
      <CardContent className="h-full flex flex-col justify-center py-6">
        <p className="text-sm text-muted-foreground text-center">
          You shopped the most at
        </p>
        <p
          className="text-3xl font-semibold tracking-tight mt-1 text-center"
          style={{
            color: mostFrequentMerchant
              ? CATEGORY_COLORS[mostFrequentMerchant.parentCategoryId] ||
                undefined
              : undefined,
          }}
        >
          {mostFrequentMerchant?.name || "-"}
        </p>
        <p className="text-4xl font-bold tracking-tight text-center mt-1">
          <NumberFlow value={visitCount} transformTiming={{ duration: 500 }} />
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {visitCount === 1 ? "time" : "times"}
          </span>
        </p>
        {mostFrequentMerchant && mostFrequentMerchant.averageSpend > 0 && (
          <>
            <p className="text-sm text-muted-foreground text-center mt-3">
              for an average of
            </p>
            <p className="text-4xl font-bold tracking-tight text-center my-1 text-foreground">
              <NumberFlow
                value={mounted ? mostFrequentMerchant.averageSpend : 0}
                format={{
                  style: "currency",
                  currency: displayCurrency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
                transformTiming={{ duration: 500 }}
              />
            </p>
          </>
        )}
        {mostFrequentMerchant && (
          <Link
            to={`/transactions?from=${dateRange.from}&to=${dateRange.to}&merchant=${encodeURIComponent(mostFrequentMerchant.name)}`}
            className="group flex items-center justify-center gap-1 text-sm text-primary mt-3"
          >
            <span className="relative">
              View {mostFrequentMerchant.name}
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full" />
            </span>
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Most Favorite Card - card with highest transaction count
 */
export const MostFavoriteCardCard: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { filteredTransactions, displayCurrency, activeTab } =
    useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Calculate date range based on active time filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (activeTab) {
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "lastMonth":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case "lastTwoMonths":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(now);
        break;
      case "lastThreeMonths":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "lastSixMonths":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "thisYear":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return {
      from: format(start, "yyyy-MM-dd"),
      to: format(end, "yyyy-MM-dd"),
    };
  }, [activeTab]);

  // Find most used card with total spend, average, and dominant category
  const mostFavoriteCard = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) {
      return null;
    }

    const cardData = new Map<
      string,
      {
        id: string;
        name: string;
        positiveCount: number;
        totalSpend: number;
        categoryCounts: Map<string, number>;
      }
    >();

    filteredTransactions.forEach((tx) => {
      if (!tx.paymentMethod?.id) return;

      // Exclude gift cards
      if (tx.paymentMethod.type === "gift_card") return;

      const cardId = tx.paymentMethod.id;
      const cardName =
        tx.paymentMethod.nickname || tx.paymentMethod.name || "Unknown Card";

      const existing = cardData.get(cardId);

      // Calculate net amount (gross - reimbursement)
      const grossAmount = CurrencyService.convert(
        tx.paymentAmount ?? tx.amount,
        tx.paymentCurrency ?? tx.currency,
        displayCurrency
      );
      const reimbursed = tx.reimbursementAmount
        ? CurrencyService.convert(
            tx.reimbursementAmount,
            tx.paymentCurrency ?? tx.currency,
            displayCurrency
          )
        : 0;
      const netAmount = grossAmount - reimbursed;

      // Only count positive transactions for frequency (negative = refunds/adjustments)
      const isPositive = tx.amount > 0;

      // Get parent category
      const categoryName = tx.category || "Uncategorized";
      const parent = getParentCategory(categoryName);
      const parentId = parent?.id || "other";

      if (existing) {
        if (isPositive) existing.positiveCount++;
        existing.totalSpend += netAmount;
        existing.categoryCounts.set(
          parentId,
          (existing.categoryCounts.get(parentId) || 0) + 1
        );
      } else {
        const categoryCounts = new Map<string, number>();
        categoryCounts.set(parentId, 1);
        cardData.set(cardId, {
          id: cardId,
          name: cardName,
          positiveCount: isPositive ? 1 : 0,
          totalSpend: netAmount,
          categoryCounts,
        });
      }
    });

    let mostUsed: {
      id: string;
      name: string;
      count: number;
      totalSpend: number;
      averageSpend: number;
      parentCategoryId: string;
    } | null = null;

    cardData.forEach((value) => {
      if (!mostUsed || value.positiveCount > mostUsed.count) {
        // Find dominant category
        let dominantCategory = "other";
        let maxCount = 0;
        value.categoryCounts.forEach((count, categoryId) => {
          if (count > maxCount) {
            maxCount = count;
            dominantCategory = categoryId;
          }
        });

        mostUsed = {
          id: value.id,
          name: value.name,
          count: value.positiveCount,
          totalSpend: value.totalSpend,
          averageSpend:
            value.positiveCount > 0
              ? value.totalSpend / value.positiveCount
              : 0,
          parentCategoryId: dominantCategory,
        };
      }
    });

    return mostUsed;
  }, [filteredTransactions, displayCurrency]);

  // Animate from 0 on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const useCount = mounted ? mostFavoriteCard?.count || 0 : 0;

  return (
    <Card className={`bg-card border-border/50 h-full ${className}`}>
      <CardContent className="h-full flex flex-col justify-center py-6">
        <p className="text-sm text-muted-foreground text-center">
          You used the most
        </p>
        <p
          className="text-3xl font-semibold tracking-tight mt-1 text-center"
          style={{
            color: mostFavoriteCard
              ? CATEGORY_COLORS[mostFavoriteCard.parentCategoryId] || undefined
              : undefined,
          }}
        >
          {mostFavoriteCard?.name || "-"}
        </p>
        <p className="text-4xl font-bold tracking-tight text-center mt-1">
          <NumberFlow value={useCount} transformTiming={{ duration: 500 }} />
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {useCount === 1 ? "time" : "times"}
          </span>
        </p>
        {mostFavoriteCard && mostFavoriteCard.totalSpend > 0 && (
          <>
            <p className="text-sm text-muted-foreground text-center mt-3">
              for a total of
            </p>
            <p className="text-4xl font-bold tracking-tight text-center my-1 text-foreground">
              <NumberFlow
                value={mounted ? mostFavoriteCard.totalSpend : 0}
                format={{
                  style: "currency",
                  currency: displayCurrency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
                transformTiming={{ duration: 500 }}
              />
            </p>
          </>
        )}
        {mostFavoriteCard && (
          <Link
            to={`/transactions?from=${dateRange.from}&to=${dateRange.to}&card=${encodeURIComponent(mostFavoriteCard.id)}`}
            className="group flex items-center justify-center gap-1 text-sm text-primary mt-3"
          >
            <span className="relative">
              View {mostFavoriteCard.name}
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full" />
            </span>
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
};

// Legacy component - kept for backwards compatibility
const KPICardsRow: React.FC<KPICardsRowProps> = ({ className = "" }) => {
  return (
    <div className={className}>
      <SecondaryKPICards />
    </div>
  );
};

export default React.memo(KPICardsRow);
