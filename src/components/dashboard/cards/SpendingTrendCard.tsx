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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { format, parseISO, startOfDay } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  ReferenceArea,
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

  // Helper to parse YYYY-MM-DD string as local date (not UTC)
  const parseLocalDate = (dateStr: string): Date => {
    // parseISO parses as local time for date-only strings in date-fns v2+
    // But to be safe, manually construct local date
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Prepare chart data based on mode
  // Only show forecast for the next 7 days from today
  const displayChartData = useMemo(() => {
    if (!shouldShowForecast || !forecastChartData) {
      return chartResult?.data || [];
    }

    // Calculate the cutoff date (today + 7 days) in local time
    const today = startOfDay(new Date());
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
        // Parse the date from originalKey (format: "YYYY-MM-DD")
        const itemDate = parseLocalDate(item.originalKey);
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

    const today = startOfDay(new Date());
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() + 7);

    // Filter to only projected days within the next 7 days
    const next7DaysData = forecastChartData.data.filter((item) => {
      if (!item.isProjected) return false;

      // Parse as local date to avoid timezone issues
      const itemDate = parseLocalDate(item.originalKey);
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

  // Add 7-day avg to chart data for projected days AND today (for tooltip)
  const chartDataWithAvg = useMemo(() => {
    if (!shouldShowForecast || displayMode !== "daily") return displayChartData;

    // Find today's date key to include it in the avg line
    const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");

    return displayChartData.map((item) => {
      const itemData = item as { isProjected?: boolean; originalKey?: string };
      // Show sevenDayAvg for projected days AND today
      const isToday = itemData.originalKey === todayStr;
      const shouldShowAvg = itemData.isProjected || isToday;

      return {
        ...item,
        sevenDayAvg: shouldShowAvg ? next7DaysForecastAvg : null,
      };
    });
  }, [displayChartData, shouldShowForecast, displayMode, next7DaysForecastAvg]);

  // Period options with labels
  const periodOptions: { value: TrendPeriod; label: string }[] = [
    { value: "week", label: "Daily" },
    { value: "month", label: "Weekly" },
    { value: "quarter", label: "Monthly" },
    { value: "year", label: "Quarterly" },
  ];

  // Create period selector with filtered options
  const periodSelector = (
    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3">
      {shouldShowForecast && (
        <div className="flex items-center gap-1.5">
          <Switch
            id="cumulative-mode"
            checked={displayMode === "cumulative"}
            onCheckedChange={(checked) =>
              setDisplayMode(checked ? "cumulative" : "daily")
            }
            className="scale-75"
          />
          <Label
            htmlFor="cumulative-mode"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            Cumulative
          </Label>
        </div>
      )}
      <Select
        value={selectedPeriod}
        onValueChange={(value) => setSelectedPeriod(value as TrendPeriod)}
      >
        <SelectTrigger className="w-28 h-8">
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

  // Find today's label in the chart data for vertical reference line
  const todayLabel = useMemo(() => {
    if (!displayChartData || displayChartData.length === 0) return null;
    // Find the last non-projected data point (today or most recent actual)
    for (let i = displayChartData.length - 1; i >= 0; i--) {
      const item = displayChartData[i] as {
        isProjected?: boolean;
        period?: string;
      };
      if (!item.isProjected && item.period) {
        return item.period;
      }
    }
    return null;
  }, [displayChartData]);

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

      {/* Only show stats for cumulative mode or non-forecast views */}
      {(!shouldShowForecast || displayMode === "cumulative") && (
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {shouldShowForecast && displayMode === "cumulative"
              ? "Next 7 days total"
              : `${getPeriodLabel(selectedPeriod)} avg`}
          </p>
          <p className="font-medium mt-1">
            {formatCurrency(
              shouldShowForecast && displayMode === "cumulative"
                ? next7DaysForecastTotal
                : average
            )}
          </p>
        </div>
      )}
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
        sevenDayAvg?: number | null;
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
      const sevenDayAvgPayload = payload.find(
        (p) => p.dataKey === "sevenDayAvg"
      );
      const data = actualPayload?.payload || forecastPayload?.payload;
      const actualValue = actualPayload?.value || 0;
      const forecastValue = forecastPayload?.value || data?.forecastAmount || 0;
      const sevenDayAvgValue = sevenDayAvgPayload?.value || data?.sevenDayAvg;
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

          {/* 7-day average forecast */}
          {sevenDayAvgValue && sevenDayAvgValue > 0 && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Next 7 days avg forecast
              </p>
              <p className="text-sm font-medium">
                {formatCurrency(sevenDayAvgValue)}
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
        <div className="flex-1 min-h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartDataWithAvg}
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

              {/* Vertical line marking today */}
              {shouldShowForecast && displayMode === "daily" && todayLabel && (
                <ReferenceLine
                  x={todayLabel}
                  stroke="#d1d5db"
                  strokeWidth={1}
                  label={{
                    value: "Today",
                    position: "insideTop",
                    fill: "#9ca3af",
                    fontSize: 9,
                    dx: 18,
                  }}
                />
              )}

              {/* Average reference line (non-cumulative) - shows 7-day avg forecast */}
              {displayMode === "daily" && !shouldShowForecast && (
                <ReferenceLine
                  y={average}
                  stroke="#9ca3af"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              )}

              {/* 7-day forecast avg line - rendered as Line for tooltip support */}
              {displayMode === "daily" && shouldShowForecast && (
                <Line
                  type="monotone"
                  dataKey="sevenDayAvg"
                  stroke="#9ca3af"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, fill: "#9ca3af" }}
                  connectNulls={false}
                  name="7-day Avg"
                />
              )}

              {/* Shaded area below 7-day avg line for forecast period */}
              {shouldShowForecast && displayMode === "daily" && todayLabel && (
                <ReferenceArea
                  x1={todayLabel}
                  y1={0}
                  y2={next7DaysForecastAvg}
                  fill="#9ca3af"
                  fillOpacity={0.1}
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
