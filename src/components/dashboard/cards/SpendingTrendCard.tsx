// components/dashboard/cards/SpendingTrendCard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { TrendingUpIcon, TrendingDownIcon, BarChart3Icon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Card from "./Card";
import { chartUtils, TimeframeTab, metricsUtils } from "@/utils/dashboard";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { CurrencyService } from "@/core/currency";
import {
  useForecast,
  aggregateForecastByWeek,
} from "@/hooks/dashboard/useForecast";
import {
  ForecastDisplayMode,
  ForecastChartData,
  spenderProfiler,
} from "@/core/forecast";
import {
  FORECAST_CHART_COLORS,
  getVarianceIndicator,
} from "@/utils/dashboard/forecastChartUtils";
import { useBudgetStreak } from "@/hooks/useBudgetStreak";
import { StreakDisplay } from "@/components/streak";
import { BADGE_DEFINITIONS } from "@/core/streak";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

type TrendPeriod = "week" | "month" | "quarter" | "year";

interface SpendingTrendCardProps {
  transactions: Transaction[];
  /** All transactions (unfiltered) - used for forecast historical analysis */
  allTransactions?: Transaction[];
  previousPeriodTransactions?: Transaction[];
  currency?: Currency;
  timeframe?: TimeframeTab;
  className?: string;
}

const SpendingTrendCard: React.FC<SpendingTrendCardProps> = ({
  transactions,
  allTransactions = [],
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
        return ["week", "month"];
      case "lastTwoMonths":
        return ["week", "month", "quarter"];
      case "lastThreeMonths":
        return ["week", "month", "quarter"];
      case "lastSixMonths":
      case "thisYear":
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
        return "week";
      case "lastTwoMonths":
        return "month";
      case "lastThreeMonths":
        return "month";
      case "lastSixMonths":
      case "thisYear":
        return "quarter";
      default:
        return "week";
    }
  };

  const [selectedPeriod, setSelectedPeriod] =
    useState<TrendPeriod>(getDefaultPeriod());
  const [displayMode, setDisplayMode] = useState<ForecastDisplayMode>("daily");

  // Reset selected period when timeframe changes if current selection is not available
  useEffect(() => {
    if (!availablePeriods.includes(selectedPeriod)) {
      setSelectedPeriod(getDefaultPeriod());
    }
  }, [timeframe, availablePeriods]);

  const { formatCurrency } = useCurrencyFormatter(currency);
  const { toast } = useToast();

  // Use the new forecast hook - pass allTransactions for historical analysis
  const {
    forecast,
    chartData: forecastChartData,
    daysRemaining,
  } = useForecast(
    allTransactions.length > 0 ? allTransactions : transactions,
    currency,
    timeframe
  );

  // Use the budget streak hook for gamification
  const {
    currentStreak,
    earnedBadges,
    nextBadge,
    newlyEarnedBadges,
    clearNewlyEarned,
  } = useBudgetStreak(currency, forecast);

  // Current month for streak display
  const currentMonth = useMemo(() => format(new Date(), "yyyy-MM"), []);

  // Show celebration toast when new badges are earned
  useEffect(() => {
    if (newlyEarnedBadges.length > 0) {
      // Get the highest milestone badge earned
      const highestMilestone = Math.max(...newlyEarnedBadges);
      const badge = BADGE_DEFINITIONS[highestMilestone as 3 | 7 | 14 | 30];

      toast({
        title: `${badge.name} Earned!`,
        description: `Congratulations! You've stayed under forecast for ${highestMilestone} days.`,
      });

      // Clear the newly earned badges after showing toast
      clearNewlyEarned();
    }
  }, [newlyEarnedBadges, toast, clearNewlyEarned]);

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

  // Process data for chart (fallback for non-thisMonth timeframes)
  const chartResult = useMemo(() => {
    return chartUtils.generateTimeSeriesData(transactions, {
      period: selectedPeriod,
      displayCurrency: currency,
      includeTrend: true,
      includeReimbursements: true,
    });
  }, [transactions, selectedPeriod, currency]);

  // Use forecast data when available, otherwise use standard chart data
  const shouldShowForecast =
    timeframe === "thisMonth" && selectedPeriod === "week" && forecastChartData;

  // Prepare chart data based on mode
  // Only show forecast for the next 7 days from today
  const displayChartData = useMemo(() => {
    if (!shouldShowForecast || !forecastChartData) {
      return chartResult?.data || [];
    }

    // Calculate the cutoff date (today + 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() + 7);

    // For weekly aggregation
    if (selectedPeriod === "month") {
      const weeklyData = aggregateForecastByWeek(forecastChartData);
      return weeklyData.data.map((item) => ({
        period: item.period,
        amount:
          displayMode === "cumulative" ? item.cumulativeAmount : item.amount,
        forecastAmount:
          displayMode === "cumulative"
            ? item.cumulativeForecast
            : item.forecastAmount,
        isProjected: item.isProjected,
        variance: item.variance,
        originalKey: item.originalKey,
      }));
    }

    // Daily data - filter to only show next 7 days of forecast
    return forecastChartData.data
      .filter((item) => {
        // Always show historical/actual data
        if (!item.isProjected) return true;

        // For projected data, only show next 7 days
        // Parse the date from originalKey (format: "YYYY-MM-DD" or day number)
        const itemDate = new Date(item.originalKey);
        if (isNaN(itemDate.getTime())) {
          // If originalKey is just a day number, construct date from current month
          const dayNum = parseInt(item.originalKey, 10);
          if (!isNaN(dayNum)) {
            const dateFromDay = new Date(
              today.getFullYear(),
              today.getMonth(),
              dayNum
            );
            return dateFromDay <= cutoffDate;
          }
          return true;
        }
        return itemDate <= cutoffDate;
      })
      .map((item) => ({
        period: item.period,
        amount:
          displayMode === "cumulative" ? item.cumulativeAmount : item.amount,
        forecastAmount:
          displayMode === "cumulative"
            ? item.cumulativeForecast
            : item.forecastAmount,
        isProjected: item.isProjected,
        variance: item.variance,
        originalKey: item.originalKey,
      }));
  }, [
    shouldShowForecast,
    forecastChartData,
    selectedPeriod,
    displayMode,
    chartResult,
  ]);

  // Extract data from chart result (for non-forecast scenarios)
  const chartData = chartResult?.data || [];
  const average = chartResult?.average || 0;

  // Calculate forecast total and average for the next 7 days only
  const { next7DaysForecastTotal, next7DaysForecastAvg } = useMemo(() => {
    if (!forecastChartData?.data)
      return { next7DaysForecastTotal: 0, next7DaysForecastAvg: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() + 7);

    // Filter to only projected days within the next 7 days
    const next7DaysData = forecastChartData.data.filter((item) => {
      if (!item.isProjected) return false;

      const itemDate = new Date(item.originalKey);
      if (isNaN(itemDate.getTime())) return false;

      return itemDate >= today && itemDate <= cutoffDate;
    });

    if (next7DaysData.length === 0)
      return { next7DaysForecastTotal: 0, next7DaysForecastAvg: 0 };

    const totalForecast = next7DaysData.reduce(
      (sum, item) => sum + item.forecastAmount,
      0
    );
    return {
      next7DaysForecastTotal: totalForecast,
      next7DaysForecastAvg: totalForecast / next7DaysData.length,
    };
  }, [forecastChartData]);

  // Period options with labels
  const periodOptions: { value: TrendPeriod; label: string }[] = [
    { value: "week", label: "Daily" },
    { value: "month", label: "Weekly" },
    { value: "quarter", label: "Monthly" },
    { value: "year", label: "Quarterly" },
  ];

  // Create period selector with filtered options
  const periodSelector = (
    <div className="flex items-center gap-2">
      {shouldShowForecast && (
        <div className="flex border rounded-md overflow-hidden">
          <Button
            variant={displayMode === "daily" ? "default" : "ghost"}
            size="sm"
            className="h-8 px-2 rounded-none text-xs"
            onClick={() => setDisplayMode("daily")}
          >
            Daily
          </Button>
          <Button
            variant={displayMode === "cumulative" ? "default" : "ghost"}
            size="sm"
            className="h-8 px-2 rounded-none text-xs"
            onClick={() => setDisplayMode("cumulative")}
          >
            Cumulative
          </Button>
        </div>
      )}
      <Select
        value={selectedPeriod}
        onValueChange={(value) => setSelectedPeriod(value as TrendPeriod)}
      >
        <SelectTrigger className="w-24 h-8">
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
    </div>
  );

  // Display trend and average section with forecast info
  const TrendAndAverage = () => (
    <div className="flex items-start justify-between mb-4">
      {/* Budget streak display when forecast is available */}
      {shouldShowForecast && forecast && (
        <StreakDisplay
          streak={currentStreak}
          badges={earnedBadges}
          nextBadge={nextBadge}
          currentMonth={currentMonth}
        />
      )}

      <div className="text-right">
        <p className="text-sm text-muted-foreground">
          {shouldShowForecast
            ? displayMode === "cumulative"
              ? "Next 7 days total"
              : "Next 7 days avg"
            : `${getPeriodLabel(selectedPeriod)} avg`}
        </p>
        <p className="font-medium mt-1">
          {formatCurrency(
            shouldShowForecast
              ? displayMode === "cumulative"
                ? next7DaysForecastTotal
                : next7DaysForecastAvg
              : average
          )}
        </p>
      </div>
    </div>
  );

  // Enhanced custom tooltip with forecast comparison
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      value: number;
      dataKey: string;
      payload?: {
        forecastAmount?: number;
        variance?: number;
        isProjected?: boolean;
        topCategories?: Array<{ category: string; amount: number }>;
        originalKey?: string;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const actualPayload = payload.find((p) => p.dataKey === "amount");
      const forecastPayload = payload.find(
        (p) => p.dataKey === "forecastAmount"
      );
      const data = actualPayload?.payload || forecastPayload?.payload;
      const actualValue = actualPayload?.value || 0;
      const forecastValue = forecastPayload?.value || data?.forecastAmount || 0;
      // Calculate variance from displayed values (works for both daily and cumulative modes)
      const variance =
        actualValue > 0 && forecastValue > 0
          ? actualValue - forecastValue
          : data?.variance;
      const isProjected = data?.isProjected;
      const topCategories =
        (
          data as {
            topCategories?: Array<{ category: string; amount: number }>;
          }
        )?.topCategories || [];
      const topCategory = topCategories[0];

      // Get variance indicator
      const varianceInfo =
        variance !== undefined ? getVarianceIndicator(variance) : null;

      return (
        <div className="bg-background border border-border p-3 rounded-lg shadow-lg min-w-[180px]">
          <p className="font-medium text-sm text-muted-foreground mb-2">
            {label}
          </p>

          {/* Actual spending (if not projected) */}
          {!isProjected && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground">Actual</p>
              <p className="text-primary text-lg font-medium">
                {formatCurrency(actualValue)}
              </p>
            </div>
          )}

          {/* Forecast amount */}
          {shouldShowForecast && forecastValue > 0 && (
            <div className={isProjected ? "" : "mb-2"}>
              <p className="text-xs text-muted-foreground">
                {isProjected ? "Forecast" : "Expected"}
              </p>
              <p
                className={`${isProjected ? "text-primary text-lg" : "text-muted-foreground text-sm"} font-medium`}
              >
                {formatCurrency(forecastValue)}
              </p>
            </div>
          )}

          {/* Variance indicator */}
          {varianceInfo && !isProjected && (
            <div
              className={`flex items-center gap-1 text-xs ${varianceInfo.color}`}
            >
              <span>{varianceInfo.icon}</span>
              <span>{varianceInfo.text}</span>
            </div>
          )}

          {/* Top category for this period (non-forecast view) */}
          {!shouldShowForecast && topCategory && (
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
      {(displayChartData.length >= 2 ||
        previousPeriodTransactions.length > 0) && <TrendAndAverage />}

      {displayChartData.length > 0 && (
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={displayChartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
            >
              <defs>
                {/* Gradient for variance area */}
                <linearGradient
                  id="varianceGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--muted))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--muted))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />

              <YAxis hide domain={["auto", "auto"]} />

              {/* Budget reference line */}
              {shouldShowForecast &&
                forecast?.budget &&
                displayMode === "cumulative" && (
                  <ReferenceLine
                    y={forecast.budget}
                    stroke={FORECAST_CHART_COLORS.budget}
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: "Budget",
                      position: "right",
                      fill: FORECAST_CHART_COLORS.budget,
                      fontSize: 10,
                    }}
                  />
                )}

              {/* Average reference line (non-cumulative) */}
              {displayMode === "daily" && (
                <ReferenceLine
                  y={
                    shouldShowForecast && forecast
                      ? forecast.patterns.dailyAverage
                      : average
                  }
                  stroke="#9ca3af"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}

              <Tooltip content={<CustomTooltip />} />

              {/* Forecast line (dashed) */}
              {shouldShowForecast && (
                <Line
                  type="monotone"
                  dataKey="forecastAmount"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Forecast"
                />
              )}

              {/* Actual spending line */}
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
                connectNulls={false}
                name="Actual"
              />

              {/* Variance area between lines */}
              {shouldShowForecast && displayMode === "cumulative" && (
                <Area
                  type="monotone"
                  dataKey="forecastAmount"
                  fill="url(#varianceGradient)"
                  stroke="none"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend for forecast view */}
      {shouldShowForecast && (
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#7c9885]" />
            <span>Actual</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-4 h-0.5 bg-[#9ca3af]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, #9ca3af 0, #9ca3af 3px, transparent 3px, transparent 6px)",
              }}
            />
            <span>Forecast</span>
          </div>
        </div>
      )}

      {/* Fallback to old pace indicator when forecast not available */}
      {!shouldShowForecast &&
        chartData.length > 0 &&
        selectedPeriod === "week" && (
          <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            <span>At this pace: </span>
            <span className="font-medium text-foreground">
              {formatCurrency(
                chartData.reduce((sum, d) => sum + (d.amount || 0), 0) +
                  (chartData.reduce((sum, d) => sum + (d.amount || 0), 0) /
                    chartData.length) *
                    (new Date(
                      new Date().getFullYear(),
                      new Date().getMonth() + 1,
                      0
                    ).getDate() -
                      new Date().getDate())
              )}
            </span>
            <span>
              {" "}
              by end of{" "}
              {new Date().toLocaleString("default", { month: "long" })} (
              {new Date(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                0
              ).getDate() - new Date().getDate()}{" "}
              days left)
            </span>
          </div>
        )}
    </Card>
  );
};

export default React.memo(SpendingTrendCard);
