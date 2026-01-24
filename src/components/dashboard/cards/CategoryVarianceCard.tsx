// components/dashboard/cards/CategoryVarianceCard.tsx
/**
 * Drill-down treemap showing spending hierarchy:
 * Parent Category → Subcategory → Merchant
 */

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronRightIcon, HomeIcon } from "lucide-react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import {
  buildCategoryHierarchy,
  ParentCategorySpending,
} from "@/utils/dashboard/categoryHierarchy";

interface CategorySpendCardProps {
  className?: string;
}

type DrillLevel = "parent" | "subcategory" | "merchant";

interface DrillState {
  level: DrillLevel;
  parentCategory?: ParentCategorySpending;
  subcategoryName?: string;
}

const CategorySpendCard: React.FC<CategorySpendCardProps> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const { filteredTransactions, displayCurrency, activeTab } =
    useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Drill-down state
  const [drillState, setDrillState] = useState<DrillState>({ level: "parent" });

  // Detect dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  // Build category hierarchy
  const hierarchy = useMemo(() => {
    return buildCategoryHierarchy(filteredTransactions, displayCurrency);
  }, [filteredTransactions, displayCurrency]);

  // Calculate merchant data for a specific subcategory
  const getMerchantData = useCallback(
    (subcategoryName: string) => {
      const byMerchant = new Map<string, number>();

      filteredTransactions.forEach((tx) => {
        const category = getEffectiveCategory(tx);
        if (category !== subcategoryName) return;

        const merchantName = tx.merchant?.name?.trim() || "Unknown";
        const grossAmount = CurrencyService.convert(
          tx.paymentAmount ?? tx.amount,
          tx.paymentCurrency ?? tx.currency,
          displayCurrency
        );
        const reimbursedAmount = tx.reimbursementAmount
          ? CurrencyService.convert(
              tx.reimbursementAmount,
              tx.paymentCurrency ?? tx.currency,
              displayCurrency
            )
          : 0;
        const netAmount = grossAmount - reimbursedAmount;
        byMerchant.set(
          merchantName,
          (byMerchant.get(merchantName) || 0) + netAmount
        );
      });

      return groupAndThreshold(byMerchant, 0.02);
    },
    [filteredTransactions, displayCurrency]
  );

  // Helper to group and threshold data
  const groupAndThreshold = (
    dataMap: Map<string, number>,
    thresholdPercent: number = 0.05
  ) => {
    const items = Array.from(dataMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    const total = items.reduce((sum, c) => sum + c.value, 0);
    const threshold = total * thresholdPercent;

    const mainItems: { name: string; value: number }[] = [];
    let otherTotal = 0;

    items.forEach((item) => {
      if (item.value >= threshold) {
        mainItems.push(item);
      } else {
        otherTotal += item.value;
      }
    });

    if (otherTotal > 0) {
      mainItems.push({ name: "Other", value: otherTotal });
    }

    return {
      name: "spending",
      children: mainItems,
    };
  };

  // Build treemap data based on drill level
  const treemapData = useMemo(() => {
    if (drillState.level === "parent") {
      // Show parent categories
      return {
        name: "spending",
        children: hierarchy.categories.map((cat) => ({
          name: cat.name,
          value: cat.amount,
        })),
      };
    } else if (
      drillState.level === "subcategory" &&
      drillState.parentCategory
    ) {
      // Show subcategories within selected parent
      return {
        name: drillState.parentCategory.name,
        children: drillState.parentCategory.subcategories.map((sub) => ({
          name: sub.name,
          value: sub.amount,
        })),
      };
    } else if (drillState.level === "merchant" && drillState.subcategoryName) {
      // Show merchants within selected subcategory
      return getMerchantData(drillState.subcategoryName);
    }

    return { name: "spending", children: [] };
  }, [drillState, hierarchy, getMerchantData]);

  // Handle click to drill down
  const handleClick = useCallback(
    (nodeName: string) => {
      if (nodeName === "Other") return; // Don't drill into "Other"

      if (drillState.level === "parent") {
        const parentCat = hierarchy.categories.find(
          (cat) => cat.name === nodeName
        );
        if (parentCat) {
          setDrillState({
            level: "subcategory",
            parentCategory: parentCat,
          });
        }
      } else if (drillState.level === "subcategory") {
        setDrillState({
          ...drillState,
          level: "merchant",
          subcategoryName: nodeName,
        });
      } else if (drillState.level === "merchant") {
        // At merchant level, navigate to transactions filtered by merchant and category
        const dateRange = getDateRange();
        const params = new URLSearchParams();
        if (nodeName !== "Other") {
          params.set("merchant", nodeName);
        }
        if (drillState.subcategoryName) {
          params.set("category", drillState.subcategoryName);
        }
        if (dateRange) {
          params.set("from", formatDate(dateRange.from));
          params.set("to", formatDate(dateRange.to));
        }
        navigate(`/transactions?${params.toString()}`);
      }
    },
    [drillState, hierarchy, navigate]
  );

  // Navigate back in breadcrumb
  const goToLevel = useCallback(
    (level: DrillLevel) => {
      if (level === "parent") {
        setDrillState({ level: "parent" });
      } else if (level === "subcategory" && drillState.parentCategory) {
        setDrillState({
          level: "subcategory",
          parentCategory: drillState.parentCategory,
        });
      }
    },
    [drillState.parentCategory]
  );

  // Convert activeTab to date range for navigation
  const getDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (activeTab) {
      case "thisMonth": {
        const from = new Date(year, month, 1);
        const to = new Date(year, month + 1, 0);
        return { from, to };
      }
      case "lastMonth": {
        const from = new Date(year, month - 1, 1);
        const to = new Date(year, month, 0);
        return { from, to };
      }
      case "lastTwoMonths": {
        const from = new Date(year, month - 1, 1);
        const to = new Date(year, month + 1, 0);
        return { from, to };
      }
      case "lastThreeMonths": {
        const from = new Date(year, month - 2, 1);
        const to = new Date(year, month + 1, 0);
        return { from, to };
      }
      case "lastSixMonths": {
        const from = new Date(year, month - 5, 1);
        const to = new Date(year, month + 1, 0);
        return { from, to };
      }
      case "thisYear": {
        const from = new Date(year, 0, 1);
        const to = new Date(year, 11, 31);
        return { from, to };
      }
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Japandi color palette
  const colors = [
    "hsl(152, 40%, 40%)", // Sage green
    "hsl(25, 45%, 45%)", // Warm terracotta
    "hsl(200, 35%, 45%)", // Dusty blue
    "hsl(45, 45%, 45%)", // Sand
    "hsl(340, 35%, 45%)", // Dusty rose
    "hsl(170, 35%, 40%)", // Teal
    "hsl(30, 40%, 40%)", // Warm brown
    "hsl(260, 30%, 45%)", // Muted lavender
  ];

  const hasData = treemapData.children.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => goToLevel("parent")}
            className={`flex items-center gap-1 hover:text-primary transition-colors ${
              drillState.level === "parent"
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }`}
          >
            <HomeIcon className="h-4 w-4" />
            <span>Spending</span>
          </button>

          {drillState.level !== "parent" && drillState.parentCategory && (
            <>
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
              <button
                onClick={() => goToLevel("subcategory")}
                className={`hover:text-primary transition-colors ${
                  drillState.level === "subcategory"
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {drillState.parentCategory.name}
              </button>
            </>
          )}

          {drillState.level === "merchant" && drillState.subcategoryName && (
            <>
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                {drillState.subcategoryName}
              </span>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No spending data available for this period.
          </p>
        ) : (
          <div className="h-56">
            <ResponsiveTreeMap
              data={treemapData}
              identity="name"
              value="value"
              valueFormat={(value) => formatCurrency(value)}
              leavesOnly={true}
              innerPadding={4}
              outerPadding={2}
              enableParentLabel={false}
              label={(node) => node.id as string}
              labelSkipSize={40}
              orientLabel={false}
              labelTextColor={isDarkMode ? "white" : "black"}
              theme={{
                labels: {
                  text: {
                    fontSize: 15,
                    fontWeight: 500,
                  },
                },
              }}
              colors={colors}
              borderWidth={0}
              animate={true}
              motionConfig="gentle"
              onClick={(node) => handleClick(node.id as string)}
              tooltip={({ node }) => (
                <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md text-sm">
                  <strong>{node.id}</strong>
                  <br />
                  {formatCurrency(node.value)}
                  {node.id !== "Other" && drillState.level !== "merchant" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to drill down
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(CategorySpendCard);
