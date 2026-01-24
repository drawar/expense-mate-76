// components/dashboard/cards/CategoryPeriodComparisonCard.tsx
/**
 * Grouped vertical bar chart comparing spending by category
 * between current and previous periods
 */

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { buildCategoryHierarchy } from "@/utils/dashboard/categoryHierarchy";
import { PARENT_CATEGORIES } from "@/utils/constants/categories";
import { BarChart3Icon } from "lucide-react";

interface CategoryPeriodComparisonCardProps {
  className?: string;
}

// Category colors matching the new palette
const CATEGORY_COLORS: Record<string, string> = {
  essentials: "#073B4C", // Dark Teal
  lifestyle: "#FFD166", // Golden Pollen
  home_living: "#118AB2", // Ocean Blue
  personal_care: "#EF476F", // Bubblegum Pink
  work_education: "#06D6A0", // Emerald
  financial_other: "#F78C6B", // Coral Glow
};

// Convert hex to rgba with opacity
function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

const CategoryPeriodComparisonCard: React.FC<
  CategoryPeriodComparisonCardProps
> = ({ className = "" }) => {
  const {
    filteredTransactions,
    previousPeriodTransactions,
    displayCurrency,
    activeTab,
  } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Get period labels based on activeTab
  const { currentLabel, previousLabel } = useMemo(() => {
    switch (activeTab) {
      case "thisMonth":
        return { currentLabel: "This Month", previousLabel: "Last Month" };
      case "lastMonth":
        return { currentLabel: "Last Month", previousLabel: "2 Months Ago" };
      case "lastTwoMonths":
        return {
          currentLabel: "Last 2 Months",
          previousLabel: "Prior 2 Months",
        };
      case "lastThreeMonths":
        return {
          currentLabel: "Last 3 Months",
          previousLabel: "Prior 3 Months",
        };
      case "lastSixMonths":
        return {
          currentLabel: "Last 6 Months",
          previousLabel: "Prior 6 Months",
        };
      case "thisYear":
        return { currentLabel: "This Year", previousLabel: "Last Year" };
      default:
        return { currentLabel: "Current", previousLabel: "Previous" };
    }
  }, [activeTab]);

  // Build category data for both periods
  const chartData = useMemo(() => {
    const currentHierarchy = buildCategoryHierarchy(
      filteredTransactions,
      displayCurrency
    );
    const previousHierarchy = buildCategoryHierarchy(
      previousPeriodTransactions || [],
      displayCurrency
    );

    // Create a map for quick lookup
    const currentByCategory = new Map(
      currentHierarchy.categories.map((cat) => [cat.id, cat.amount])
    );
    const previousByCategory = new Map(
      previousHierarchy.categories.map((cat) => [cat.id, cat.amount])
    );

    // Build data for all 6 parent categories (even if 0)
    // Sort by current period value (descending) so tallest bars are on the left
    return PARENT_CATEGORIES.map((parent) => {
      const current = currentByCategory.get(parent.id) || 0;
      const previous = previousByCategory.get(parent.id) || 0;
      const color = CATEGORY_COLORS[parent.id] || "#6b7280";
      const diff = current - previous;

      // Calculate percentage change
      let percentChange: string;
      if (previous === 0 && current > 0) {
        percentChange = "new";
      } else if (previous > 0) {
        const pct = Math.round((diff / previous) * 100);
        percentChange = pct > 0 ? `+${pct}%` : `${pct}%`;
      } else {
        percentChange = "";
      }

      return {
        id: parent.id,
        name: parent.name,
        shortName: getShortName(parent.name),
        current,
        previous,
        color,
        colorMuted: hexToRgba(color, 0.4), // 40% opacity for previous period
        percentChange,
        isIncrease: diff > 0,
      };
    })
      .filter((cat) => cat.current > 0 || cat.previous > 0) // Only show categories with data
      .sort((a, b) => b.current - a.current); // Sort by current period (tallest first)
  }, [filteredTransactions, previousPeriodTransactions, displayCurrency]);

  // Short names for x-axis
  function getShortName(name: string): string {
    const shortNames: Record<string, string> = {
      Essentials: "Essentials",
      Lifestyle: "Lifestyle",
      "Home & Living": "Home",
      "Personal Care": "Personal",
      "Work & Education": "Work",
      "Financial & Other": "Financial",
    };
    return shortNames[name] || name;
  }

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      dataKey: string;
      payload: { name: string; color: string };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const categoryData = payload[0]?.payload;
      const currentValue =
        payload.find((p) => p.dataKey === "current")?.value || 0;
      const previousValue =
        payload.find((p) => p.dataKey === "previous")?.value || 0;
      const diff = currentValue - previousValue;
      const percentChange =
        previousValue > 0
          ? ((diff / previousValue) * 100).toFixed(0)
          : currentValue > 0
            ? "+100"
            : "0";

      return (
        <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md text-sm">
          <p
            className="font-medium mb-1"
            style={{ color: categoryData?.color }}
          >
            {categoryData?.name || label}
          </p>
          <div className="space-y-0.5 text-sm">
            <p>
              {currentLabel}:{" "}
              <span className="font-medium">
                {formatCurrency(currentValue)}
              </span>
            </p>
            <p>
              {previousLabel}:{" "}
              <span className="font-medium">
                {formatCurrency(previousValue)}
              </span>
            </p>
            {previousValue > 0 && (
              <p
                className={
                  diff > 0 ? "text-red-500" : diff < 0 ? "text-emerald-500" : ""
                }
              >
                {diff > 0 ? "+" : ""}
                {formatCurrency(diff)} ({percentChange}%)
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const hasData = chartData.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Category Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No spending data available for comparison.
          </p>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                  barGap={2}
                  barCategoryGap="20%"
                >
                  <XAxis
                    dataKey="shortName"
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                    tick={{ fontSize: 14, fill: "#9ca3af" }}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 14, fill: "#9ca3af" }}
                    tickFormatter={(value) => {
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                      return value.toString();
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Previous period bars - 40% opacity category color (left) */}
                  <Bar
                    dataKey="previous"
                    name={previousLabel}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`previous-${index}`} fill={entry.colorMuted} />
                    ))}
                  </Bar>

                  {/* Current period bars - colored by category (right) */}
                  <Bar
                    dataKey="current"
                    name={currentLabel}
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`current-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="percentChange"
                      position="top"
                      style={{ fontSize: 14, fontWeight: 500 }}
                      fill="#9ca3af"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(CategoryPeriodComparisonCard);
