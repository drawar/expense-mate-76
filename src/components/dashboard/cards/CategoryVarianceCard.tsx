// components/dashboard/cards/CategoryVarianceCard.tsx
/**
 * Treemap showing spending by category
 * Visual proportions at a glance
 */

import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveTreeMap } from "@nivo/treemap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { getEffectiveCategory } from "@/utils/categoryMapping";

interface CategorySpendCardProps {
  className?: string;
}

const CategorySpendCard: React.FC<CategorySpendCardProps> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const { filteredTransactions, displayCurrency, activeTab } =
    useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

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

  // Calculate net spending by category (gross - reimbursements)
  // Group small categories (<5%) into "Other"
  const treemapData = useMemo(() => {
    const byCategory = new Map<string, number>();

    filteredTransactions.forEach((tx) => {
      const category = getEffectiveCategory(tx) || "Other";
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
      byCategory.set(category, (byCategory.get(category) || 0) + netAmount);
    });

    // Convert to array and filter positive values
    const categories = Array.from(byCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    // Calculate total for percentage threshold
    const total = categories.reduce((sum, c) => sum + c.value, 0);
    const threshold = total * 0.05; // 5% threshold

    // Group small categories into "Other"
    const mainCategories: { name: string; value: number }[] = [];
    let otherTotal = 0;

    categories.forEach((cat) => {
      if (cat.value >= threshold) {
        mainCategories.push(cat);
      } else {
        otherTotal += cat.value;
      }
    });

    // Add "Other" if there are grouped small categories
    if (otherTotal > 0) {
      mainCategories.push({ name: "Other", value: otherTotal });
    }

    return {
      name: "spending",
      children: mainCategories,
    };
  }, [filteredTransactions, displayCurrency]);

  const hasData = treemapData.children.length > 0;

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

  // Japandi color palette - darker for better contrast
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

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">
            No spending data available for this period.
          </p>
        ) : (
          <div className="h-48">
            <ResponsiveTreeMap
              data={treemapData}
              identity="name"
              value="value"
              valueFormat={(value) => formatCurrency(value)}
              leavesOnly={true}
              innerPadding={3}
              outerPadding={0}
              label={(node) => node.id as string}
              labelSkipSize={60}
              orientLabel={false}
              labelTextColor={isDarkMode ? "white" : "black"}
              theme={{
                labels: {
                  text: {
                    fontSize: 13,
                    fontWeight: 400,
                  },
                },
              }}
              colors={colors}
              borderWidth={0}
              animate={true}
              motionConfig="gentle"
              onClick={(node) => {
                const category = node.id as string;
                const dateRange = getDateRange();
                const params = new URLSearchParams();
                // Don't filter by category if clicking "Other" (grouped small categories)
                if (category !== "Other") {
                  params.set("category", category);
                }
                if (dateRange) {
                  params.set("from", formatDate(dateRange.from));
                  params.set("to", formatDate(dateRange.to));
                }
                navigate(`/transactions?${params.toString()}`);
              }}
              tooltip={({ node }) => (
                <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md text-sm">
                  <strong>{node.id}</strong>
                  <br />
                  {formatCurrency(node.value)}
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
