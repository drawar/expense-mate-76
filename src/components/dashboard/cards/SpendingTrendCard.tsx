// components/dashboard/cards/SpendingTrendCard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import Card from "./Card";
import { chartUtils, TimeframeTab, metricsUtils } from "@/utils/dashboard";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { CurrencyService } from "@/core/currency";
import {
  LineChart,
  Line,
  XAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TrendPeriod = "week" | "month" | "quarter" | "year";

interface SpendingTrendCardProps {
  transactions: Transaction[];
  previousPeriodTransactions?: Transaction[];
  currency?: Currency;
  timeframe?: TimeframeTab;
  className?: string;
}

const SpendingTrendCard: React.FC<SpendingTrendCardProps> = ({
  transactions,
  previousPeriodTransactions = [],
  currency = "SGD",
  timeframe = "thisMonth",
  className = "",
}) => {
  // Get available periods based on timeframe
  const availablePeriods = useMemo((): TrendPeriod[] => {
    switch (timeframe) {
      case "thisMonth":
      case "lastMonth":
        // For single month, only show Daily (week) and Weekly (month)
        return ["week", "month"];
      case "lastTwoMonths":
        // For 2 months, show Daily, Weekly, Monthly
        return ["week", "month", "quarter"];
      case "lastThreeMonths":
        // For 3 months, show Daily, Weekly, Monthly
        return ["week", "month", "quarter"];
      case "lastSixMonths":
      case "thisYear":
        // For longer periods, show all options
        return ["week", "month", "quarter", "year"];
      default:
        return ["week", "month", "quarter", "year"];
    }
  }, [timeframe]);

  // Get default period based on timeframe
  const getDefaultPeriod = (): TrendPeriod => {
    switch (timeframe) {
      case "thisMonth":
      case "lastMonth":
        return "week"; // Daily view for single month
      case "lastTwoMonths":
        return "month"; // Weekly view for 2 months
      case "lastThreeMonths":
        return "month"; // Weekly view for 3 months
      case "lastSixMonths":
      case "thisYear":
        return "quarter"; // Monthly view for longer periods
      default:
        return "week";
    }
  };

  const [selectedPeriod, setSelectedPeriod] =
    useState<TrendPeriod>(getDefaultPeriod());

  // Reset selected period when timeframe changes if current selection is not available
  useEffect(() => {
    if (!availablePeriods.includes(selectedPeriod)) {
      setSelectedPeriod(getDefaultPeriod());
    }
  }, [timeframe, availablePeriods]);
  const { formatCurrency } = useCurrencyFormatter(currency);

  // Map period values to display labels
  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      week: "Daily",
      month: "Weekly",
      quarter: "Monthly",
      year: "Quarterly",
    };
    return labels[period] || "Daily";
  };

  // Process data for chart
  const chartResult = React.useMemo(() => {
    return chartUtils.generateTimeSeriesData(transactions, {
      period: selectedPeriod,
      displayCurrency: currency,
      includeTrend: true,
      includeReimbursements: true,
    });
  }, [transactions, selectedPeriod, currency]);

  // Extract data from chart result
  const chartData = chartResult?.data || [];
  const trend = chartResult?.trend || 0;
  const average = chartResult?.average || 0;

  // Calculate spending pace (for daily view)
  const spendingPace = React.useMemo(() => {
    if (selectedPeriod !== "week" || chartData.length === 0) return null;

    const totalSpent = chartData.reduce((sum, d) => sum + (d.amount || 0), 0);
    const daysElapsed = chartData.length;
    const dailyAvg = totalSpent / daysElapsed;

    // Get current date info for projection
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const daysRemaining = daysInMonth - now.getDate();
    const projectedTotal = totalSpent + dailyAvg * daysRemaining;

    // Get month name for display
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthName = monthNames[now.getMonth()];

    return {
      dailyAvg,
      projectedTotal,
      daysRemaining,
      monthName,
    };
  }, [chartData, selectedPeriod]);

  // Period options with labels
  const periodOptions: { value: TrendPeriod; label: string }[] = [
    { value: "week", label: "Daily" },
    { value: "month", label: "Weekly" },
    { value: "quarter", label: "Monthly" },
    { value: "year", label: "Quarterly" },
  ];

  // Create period selector with filtered options
  const periodSelector = (
    <Select
      value={selectedPeriod}
      onValueChange={(value) => setSelectedPeriod(value as TrendPeriod)}
    >
      <SelectTrigger className="w-32 h-8">
        <span className="text-sm">{getPeriodLabel(selectedPeriod)}</span>
      </SelectTrigger>
      <SelectContent>
        {periodOptions
          .filter((option) => availablePeriods.includes(option.value))
          .map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );

  // Get previous period name for context
  const getPreviousPeriodName = React.useMemo(() => {
    const now = new Date();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    switch (selectedPeriod) {
      case "week": {
        // For daily view within this month, compare to last month
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return monthNames[lastMonth.getMonth()];
      }
      case "month": {
        // For weekly view, show "last month"
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return monthNames[lastMonth.getMonth()];
      }
      case "quarter": {
        // For monthly view, show "last quarter"
        return "last quarter";
      }
      case "year": {
        return `${now.getFullYear() - 1}`;
      }
      default:
        return "last period";
    }
  }, [selectedPeriod]);

  // Calculate current and previous period totals from actual transaction data
  const periodComparison = React.useMemo(() => {
    // Calculate current period total from chart data
    const currentTotal = chartData.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate previous period total from actual previous period transactions
    const previousTotal = previousPeriodTransactions.reduce((sum, tx) => {
      const convertedAmount = CurrencyService.convert(
        tx.amount,
        tx.currency as Currency,
        currency,
        tx.paymentMethod
      );
      // Adjust for reimbursements
      let finalAmount = convertedAmount;
      if (tx.reimbursementAmount) {
        const reimbursedAmount = CurrencyService.convert(
          tx.reimbursementAmount,
          tx.currency as Currency,
          currency,
          tx.paymentMethod
        );
        finalAmount -= reimbursedAmount;
      }
      return sum + finalAmount;
    }, 0);

    return {
      current: currentTotal,
      previous: previousTotal,
    };
  }, [chartData, previousPeriodTransactions, currency]);

  // Calculate actual period-over-period trend
  const actualTrend = React.useMemo(() => {
    if (!periodComparison) return 0;
    return metricsUtils.calculatePercentageChange(
      periodComparison.current,
      periodComparison.previous
    );
  }, [periodComparison]);

  // Display trend and average section with improved context
  const TrendAndAverage = () => (
    <div className="flex items-center justify-between mb-4">
      {/* TODO: Re-enable period comparison when logic is refined
      <div>
        <p className="text-sm text-muted-foreground">
          vs {getPreviousPeriodName}
        </p>
        <div className="flex items-center gap-1 mt-1">
          {actualTrend >= 0 ? (
            <TrendingUpIcon className="h-4 w-4 text-[var(--color-error)]" />
          ) : (
            <TrendingDownIcon className="h-4 w-4 text-[var(--color-success)]" />
          )}
          <span
            className={
              actualTrend >= 0
                ? "font-medium text-[var(--color-error)]"
                : "font-medium text-[var(--color-success)]"
            }
          >
            {actualTrend >= 0 ? "+" : ""}
            {actualTrend.toFixed(0)}%
          </span>
          {periodComparison && periodComparison.previous > 0 && (
            <span className="text-xs text-muted-foreground ml-1">
              ({formatCurrency(periodComparison.previous)} →{" "}
              {formatCurrency(periodComparison.current)})
            </span>
          )}
        </div>
      </div>
      */}

      <div className="text-right">
        <p className="text-sm text-muted-foreground">
          {getPeriodLabel(selectedPeriod)} avg
        </p>
        <p className="font-medium mt-1">{formatCurrency(average)}</p>
      </div>
    </div>
  );

  // Define custom tooltip with enhanced context
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      payload?: {
        topCategories?: Array<{ category: string; amount: number }>;
        originalKey?: string;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const data = payload[0].payload;
      const topCategories = data?.topCategories || [];
      const topCategory = topCategories[0];

      // Compare to average
      const vsAverage = average > 0 ? ((value - average) / average) * 100 : 0;
      const isAboveAvg = vsAverage > 5;
      const isBelowAvg = vsAverage < -5;

      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg min-w-[160px]">
          <p className="font-medium text-sm text-muted-foreground mb-1">
            {label}
          </p>
          <p className="text-primary text-xl font-medium">
            {formatCurrency(value)}
          </p>

          {/* Comparison to average */}
          {average > 0 && (
            <p
              className={`text-xs mt-1 ${isAboveAvg ? "text-[var(--color-error)]" : isBelowAvg ? "text-[var(--color-success)]" : "text-muted-foreground"}`}
            >
              {isAboveAvg ? "+" : ""}
              {vsAverage.toFixed(0)}% vs avg
            </p>
          )}

          {/* Top category for this period */}
          {topCategory && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Top category:</p>
              <p className="text-sm font-medium truncate">
                {topCategory.category}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title="Spending Trends"
      icon={<TrendingUpIcon className="h-5 w-5 text-primary" />}
      className={className}
      actions={periodSelector}
      emptyState={{
        title: "No Spending Data",
        description: "There's no spending data available for this period",
        icon: <TrendingUpIcon className="h-8 w-8 text-muted-foreground mb-2" />,
      }}
    >
      {(chartData.length >= 2 || previousPeriodTransactions.length > 0) && (
        <TrendAndAverage />
      )}

      {chartData.length > 0 && (
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
            >
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              {/* Average reference line */}
              <ReferenceLine
                y={average}
                stroke="#9ca3af"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#7c9885"
                strokeWidth={2}
                dot={{ fill: "#7c9885", strokeWidth: 0, r: 3 }}
                activeDot={{
                  fill: "#7c9885",
                  strokeWidth: 2,
                  stroke: "#fff",
                  r: 5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Spending pace indicator */}
      {spendingPace && (
        <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <span>At this pace: </span>
          <span className="font-medium text-foreground">
            {formatCurrency(spendingPace.projectedTotal)}
          </span>
          <span>
            {" "}
            by end of {spendingPace.monthName} ({spendingPace.daysRemaining}{" "}
            days left)
          </span>
        </div>
      )}
    </Card>
  );
};

export default React.memo(SpendingTrendCard);
