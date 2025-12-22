// src/components/dashboard/cards/SpendingDistributionCard.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Currency, Transaction } from "@/types";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CreditCardIcon,
  TagIcon,
  StoreIcon,
  LightbulbIcon,
} from "lucide-react";
import { Chevron } from "@/components/ui/chevron";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartDataItem } from "@/types/dashboard";
import { CurrencyService } from "@/core/currency";
// Japandi muted color palette for merchants
const MERCHANT_COLORS = [
  "#7c9885", // Primary sage
  "#6a8574", // Deeper sage
  "#5d7567", // Deep sage
  "#8b9a8f", // Light gray-green
  "#a86f64", // Terracotta
  "#c4a57b", // Clay
  "#8e8a85", // Warm gray
  "#5c5854", // Dark warm gray
  "#9c8f7e", // Taupe
  "#7a8b7f", // Muted green
];

interface SpendingDistributionCardProps {
  categoryData: ChartDataItem[];
  paymentMethodData: ChartDataItem[];
  transactions?: Transaction[];
  currency?: Currency;
  className?: string;
  maxCategories?: number;
  maxMerchants?: number;
  highlightTopMethod?: boolean;
}

type ViewMode = "category" | "payment" | "merchant";

/**
 * A combined card component that toggles between category, payment method, and merchant views
 */
const SpendingDistributionCard: React.FC<SpendingDistributionCardProps> = ({
  categoryData,
  paymentMethodData,
  transactions = [],
  currency = "SGD",
  className = "",
  maxCategories = 10,
  maxMerchants = 5,
  highlightTopMethod = true,
}) => {
  // State to track which view is currently active
  const [viewMode, setViewMode] = useState<ViewMode>("category");

  // Process category data
  const processedCategoryData = React.useMemo(() => {
    if (!categoryData || categoryData.length <= maxCategories)
      return categoryData;

    // Sort by value descending
    const sortedData = [...categoryData].sort((a, b) => b.value - a.value);

    // Take top categories
    const topCategories = sortedData.slice(0, maxCategories - 1);

    // Group the rest as "Other"
    const otherCategories = sortedData.slice(maxCategories - 1);
    const otherValue = otherCategories.reduce(
      (sum, item) => sum + item.value,
      0
    );

    if (otherValue > 0) {
      return [
        ...topCategories,
        {
          name: "Other",
          value: otherValue,
          color: "#9e9e9e", // Gray color for "Other" category
        },
      ];
    }

    return topCategories;
  }, [categoryData, maxCategories]);

  // Calculate smart swap suggestions based on spending patterns
  const smartSwaps = React.useMemo(() => {
    if (!categoryData || categoryData.length === 0) return null;

    const swaps: { tip: string; savings: number }[] = [];

    // Find Food & Drinks spending
    const foodDrinks = categoryData.find((c) => c.name === "Food & Drinks");
    if (foodDrinks && foodDrinks.value > 100) {
      // Suggest 30% savings from cooking at home
      swaps.push({
        tip: "Cook 2 more meals/week",
        savings: Math.round(foodDrinks.value * 0.3),
      });
    }

    // Find Shopping spending
    const shopping = categoryData.find((c) => c.name === "Shopping");
    if (shopping && shopping.value > 50) {
      swaps.push({
        tip: "Wait 24h before purchases",
        savings: Math.round(shopping.value * 0.2),
      });
    }

    // Find Entertainment spending
    const entertainment = categoryData.find((c) => c.name === "Entertainment");
    if (entertainment && entertainment.value > 30) {
      swaps.push({
        tip: "Try free activities",
        savings: Math.round(entertainment.value * 0.4),
      });
    }

    // Return top 2 suggestions sorted by savings
    return swaps.sort((a, b) => b.savings - a.savings).slice(0, 2);
  }, [categoryData]);

  // Process payment method data
  const processedPaymentData = React.useMemo(() => {
    if (!paymentMethodData || !highlightTopMethod) return paymentMethodData;

    // Sort by value descending to find top method
    const sortedData = [...paymentMethodData].sort((a, b) => b.value - a.value);

    if (sortedData.length > 0) {
      // Add visual differentiation to the top method
      return sortedData.map((item, index) => ({
        ...item,
        highlighted: index === 0,
      }));
    }

    return paymentMethodData;
  }, [paymentMethodData, highlightTopMethod]);

  // Process merchant data from transactions
  const processedMerchantData = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Aggregate spending by merchant
    const merchantMap = new Map<string, { total: number; count: number }>();

    transactions.forEach((tx) => {
      const merchantName = tx.merchant.name;
      const existing = merchantMap.get(merchantName) || { total: 0, count: 0 };
      merchantMap.set(merchantName, {
        total: existing.total + tx.amount,
        count: existing.count + 1,
      });
    });

    // Convert to array and sort by total descending
    const merchantArray = Array.from(merchantMap.entries())
      .map(([name, data], index) => ({
        name,
        value: data.total,
        count: data.count,
        color: MERCHANT_COLORS[index % MERCHANT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, maxMerchants);

    return merchantArray;
  }, [transactions, maxMerchants]);

  // Get active data based on current view mode
  const activeData =
    viewMode === "category"
      ? processedCategoryData
      : viewMode === "payment"
        ? processedPaymentData
        : processedMerchantData;

  // Get title based on current view mode
  const getTitle = () => {
    switch (viewMode) {
      case "category":
        return "Expense Categories";
      case "payment":
        return "Payment Methods";
      case "merchant":
        return "Top Merchants";
    }
  };

  // Get icon based on current view mode
  const getIcon = () => {
    switch (viewMode) {
      case "category":
        return <TagIcon className="h-5 w-5 text-primary" />;
      case "payment":
        return <CreditCardIcon className="h-5 w-5 text-primary" />;
      case "merchant":
        return <StoreIcon className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </CardTitle>

          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
          >
            <ToggleGroupItem value="category" aria-label="View categories">
              <TagIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="merchant" aria-label="View top merchants">
              <StoreIcon className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="payment" aria-label="View payment methods">
              <CreditCardIcon className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {activeData && activeData.length > 0 ? (
          <div className="mt-2 space-y-3">
            <div className="space-y-2">
              {activeData.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <div
                      className="w-3 h-3 rounded-sm mr-2 flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className={`truncate text-[14px] font-medium text-olive-green dark:text-white block ${
                          item.highlighted ? "font-semibold" : ""
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      {viewMode === "merchant" && item.count && (
                        <span className="text-[11px] text-muted-foreground">
                          {item.count}{" "}
                          {item.count === 1 ? "transaction" : "transactions"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-[14px] font-semibold text-olive-green dark:text-white ml-2">
                    {CurrencyService.format(item.value, currency)}
                  </div>
                </div>
              ))}
            </div>

            {/* View All Link */}
            {viewMode === "category" &&
              (categoryData?.length || 0) > maxCategories && (
                <Link
                  to="/transactions"
                  className="text-sm text-primary flex items-center justify-center mt-2 hover:underline"
                >
                  View All Categories{" "}
                  <Chevron direction="right" size="small" className="ml-1" />
                </Link>
              )}

            {/* Smart Swaps - only show in category view */}
            {viewMode === "category" && smartSwaps && smartSwaps.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-2">
                  <LightbulbIcon className="h-3.5 w-3.5" />
                  Smart swaps
                </div>
                <div className="space-y-1.5">
                  {smartSwaps.map((swap, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">{swap.tip}</span>
                      <span className="text-[var(--color-success)] font-medium">
                        Save {CurrencyService.format(swap.savings, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 text-muted-foreground">
            <p className="text-sm">
              No{" "}
              {viewMode === "category"
                ? "category"
                : viewMode === "merchant"
                  ? "merchant"
                  : "payment method"}{" "}
              data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendingDistributionCard);
