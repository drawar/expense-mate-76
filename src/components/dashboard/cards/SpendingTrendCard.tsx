// src/components/dashboard/cards/SpendingTrendCard.tsx
import React, { useState, useMemo } from "react";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import { BarChart } from "@/components/dashboard/charts/BarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyService } from "@/services/CurrencyService";

interface SpendingTrendCardProps {
  title?: string;
  transactions: Transaction[];
  currency?: Currency;
  initialPeriod?: "day" | "week" | "month" | "quarter";
  className?: string;
}

/**
 * A specialized card for displaying spending trends over time with period selection
 * Mimics the implementation of SpendingTrendChart but as a functional component
 */
const SpendingTrendCard: React.FC<SpendingTrendCardProps> = ({
  title = "Spending Trends",
  transactions,
  currency = "SGD",
  initialPeriod = "month",
  className = "",
}) => {
  // State for selected period
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);

  // Apply domain-specific colors for spending trends
  const spendingBarColor = "#8884d8";
  const spendingHoverColor = "#7171d6";

  // Check if transactions exist early to prevent unnecessary calculations
  const hasTransactions = transactions.length > 0;

  // Memoize category processing function to avoid recreation on each render
  const getTopCategoriesForPeriod = React.useCallback(
    (
      periodTransactions: Transaction[]
    ): Array<{ category: string; amount: number }> => {
      // Group by category
      const categoryMap = new Map<string, number>();

      periodTransactions.forEach((tx) => {
        if (!tx.category) return;

        const existingAmount = categoryMap.get(tx.category) || 0;
        categoryMap.set(tx.category, existingAmount + tx.amount);
      });

      // Convert to array and sort by amount (descending)
      const categories = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

      return categories.slice(0, 3); // Return top 3 categories
    },
    []
  );

  // Memoize period mapping to avoid recreation on each render
  const periodMapping = React.useMemo(
    () => ({
      week: "day",
      month: "week",
      quarter: "month",
      year: "month",
    }),
    []
  );

  // Process transactions for spending trends analysis with optimized memoization
  const { chartData, trend, average, topCategories } = useMemo(() => {
    if (!hasTransactions) {
      return { chartData: [], trend: 0, average: 0, topCategories: [] };
    }

    // Group transactions by date
    const groupedTransactions = new Map<string, Transaction[]>();

    // Use the selected period to determine the grouping granularity
    const groupBy = periodMapping[selectedPeriod];

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      let key: string;

      // Create the appropriate date key based on the grouping period
      switch (groupBy) {
        case "day":
          key = txDate.toISOString().split("T")[0]; // YYYY-MM-DD
          break;
        case "week": {
          // Get the start of the week (Sunday)
          const startOfWeek = new Date(txDate);
          startOfWeek.setDate(txDate.getDate() - txDate.getDay());
          key = startOfWeek.toISOString().split("T")[0];
          break;
        }
        case "month":
          key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
          break;
        default:
          key = txDate.toISOString().split("T")[0];
      }

      if (!groupedTransactions.has(key)) {
        groupedTransactions.set(key, []);
      }
      groupedTransactions.get(key)?.push(tx);
    });

    // Get sorted keys once to avoid repeated sorting
    const sortedKeys = Array.from(groupedTransactions.keys()).sort();

    // Get most recent period data for top categories
    const latestKey =
      sortedKeys.length > 0 ? sortedKeys[sortedKeys.length - 1] : null;
    const latestTransactions = latestKey
      ? groupedTransactions.get(latestKey) || []
      : [];
    const topCats = getTopCategoriesForPeriod(latestTransactions);

    // Process data for chart with a single loop
    const processedChartData = sortedKeys.map((key) => {
      const periodTransactions = groupedTransactions.get(key) || [];

      // Calculate total with a single reduce operation
      const total = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      // Optimize date formatting based on period type
      let displayDate = key;
      if (groupBy === "week") {
        // For weeks, show date range
        const startDate = new Date(key);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        displayDate = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
      } else if (groupBy === "month") {
        // For months, show month name
        const [year, month] = key.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        displayDate = date.toLocaleString("default", { month: "short" });
        if (selectedPeriod === "quarter") {
          displayDate += ` ${year}`;
        }
      }

      return {
        period: displayDate,
        amount: total,
        originalKey: key,
        // Only calculate top categories when needed (helps performance for large datasets)
        topCategories:
          periodTransactions.length > 0
            ? getTopCategoriesForPeriod(periodTransactions)
            : [],
      };
    });

    // Calculate trend and average in a single pass if possible
    let calculatedTrend = 0;
    let calculatedTotal = 0;

    if (processedChartData.length >= 2) {
      const currentAmount =
        processedChartData[processedChartData.length - 1].amount;
      const previousAmount =
        processedChartData[processedChartData.length - 2].amount;

      calculatedTrend =
        previousAmount === 0
          ? currentAmount > 0
            ? 100
            : 0
          : ((currentAmount - previousAmount) / previousAmount) * 100;
    }

    // Calculate average in a single pass to avoid a second loop
    const calculatedAverage =
      processedChartData.length > 0
        ? processedChartData.reduce((sum, item) => {
            calculatedTotal += item.amount;
            return calculatedTotal;
          }, 0) / processedChartData.length
        : 0;

    return {
      chartData: processedChartData,
      trend: calculatedTrend,
      average: calculatedAverage,
      topCategories: topCats,
    };
  }, [
    transactions,
    selectedPeriod,
    periodMapping,
    getTopCategoriesForPeriod,
    hasTransactions,
  ]);

  // Generate spending insights
  const renderInsights = () => {
    if (chartData.length < 2) {
      return <p>Not enough data for meaningful insights</p>;
    }

    const trendType = trend >= 0 ? "increase" : "decrease";
    const trendIcon =
      trend >= 0 ? (
        <TrendingUpIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
      ) : (
        <TrendingDownIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
      );

    // Find the highest spending category
    const topCategory = topCategories[0];

    return (
      <div className="mt-2 text-sm space-y-1">
        <div className="flex items-center gap-1">
          {trendIcon}
          <span>
            Your spending {trendType}d by {Math.abs(trend).toFixed(1)}% compared
            to last period
          </span>
        </div>

        {topCategory && (
          <p className="text-muted-foreground">
            Highest spending:{" "}
            {CurrencyService.format(topCategory.amount, currency)} on{" "}
            {topCategory.category}
          </p>
        )}
      </div>
    );
  };

  // Handle period change
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as "day" | "week" | "month" | "quarter");
  };

  // Return the custom card with period selector and trends
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>

          {/* Period Selector Dropdown - mimicking the original */}
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Daily</SelectItem>
              <SelectItem value="month">Weekly</SelectItem>
              <SelectItem value="quarter">Monthly</SelectItem>
              <SelectItem value="year">Quarterly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Display trend and average */}
        {chartData.length >= 2 && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Trend</p>
              <div className="flex items-center gap-1 mt-1">
                {trend >= 0 ? (
                  <TrendingUpIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
                <span
                  className={
                    trend >= 0
                      ? "font-medium text-red-600 dark:text-red-400"
                      : "font-medium text-green-600 dark:text-green-400"
                  }
                >
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="font-medium mt-1">
                {CurrencyService.format(average, currency)}
              </p>
            </div>
          </div>
        )}

        {/* Use the BarChart component for visualization */}
        <BarChart
          title=""
          transactions={transactions}
          period={selectedPeriod}
          currency={currency}
          barColor={spendingBarColor}
          hoverColor={spendingHoverColor}
          showInsights={false} // We handle insights separately
        />

        {/* Show insights below the chart */}
        {chartData.length >= 2 && renderInsights()}
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendingTrendCard);
