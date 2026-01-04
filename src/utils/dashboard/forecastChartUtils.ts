// src/utils/dashboard/forecastChartUtils.ts
/**
 * Utilities for transforming forecast data for chart rendering
 */

import {
  ForecastChartData,
  ForecastChartItem,
  ForecastDisplayMode,
} from "@/core/forecast";
import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";

/**
 * Chart colors for forecast visualization
 */
export const FORECAST_CHART_COLORS = {
  /** Color for actual spending line */
  actual: "hsl(var(--primary))",
  /** Color for forecast/projected line */
  forecast: "hsl(var(--muted-foreground))",
  /** Color for variance fill (positive - over forecast) */
  varianceOver: "hsl(var(--destructive) / 0.2)",
  /** Color for variance fill (negative - under forecast) */
  varianceUnder: "hsl(var(--success) / 0.2)",
  /** Color for budget reference line */
  budget: "hsl(var(--warning))",
};

/**
 * Get chart data formatted for the selected display mode
 */
export function getChartDataForMode(
  chartData: ForecastChartData,
  mode: ForecastDisplayMode
): ForecastChartItem[] {
  return chartData.data.map((item) => ({
    ...item,
    // For cumulative mode, use cumulative values as the main display
    displayAmount: mode === "cumulative" ? item.cumulativeAmount : item.amount,
    displayForecast:
      mode === "cumulative" ? item.cumulativeForecast : item.forecastAmount,
  }));
}

/**
 * Calculate variance between actual and forecast
 */
export function calculateVariance(
  actual: number,
  forecast: number
): {
  amount: number;
  percentage: number;
  isOver: boolean;
} {
  const amount = actual - forecast;
  const percentage = forecast > 0 ? (amount / forecast) * 100 : 0;

  return {
    amount,
    percentage,
    isOver: amount > 0,
  };
}

/**
 * Get cumulative data up to a specific point
 */
export function getCumulativeAtPoint(
  chartData: ForecastChartData,
  index: number
): { actual: number; forecast: number } {
  if (index < 0 || index >= chartData.data.length) {
    return { actual: 0, forecast: 0 };
  }

  const point = chartData.data[index];
  return {
    actual: point.cumulativeAmount,
    forecast: point.cumulativeForecast,
  };
}

/**
 * Aggregate daily data into weekly buckets
 */
export function aggregateToWeekly(
  chartData: ForecastChartData,
  targetMonth?: Date
): ForecastChartData {
  const month = targetMonth || new Date();
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  // Get all weeks that overlap with this month
  const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd });

  const weeklyData: ForecastChartItem[] = weeks.map((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart);
    const weekLabel = `Week ${index + 1}`;

    // Sum up daily data for this week
    let weekAmount = 0;
    let weekForecast = 0;
    let lastCumulativeAmount = 0;
    let lastCumulativeForecast = 0;
    let hasActualData = false;

    chartData.data.forEach((day) => {
      const dayDate = parseISO(day.originalKey);
      if (dayDate >= weekStart && dayDate <= weekEnd) {
        weekAmount += day.amount;
        weekForecast += day.forecastAmount;
        lastCumulativeAmount = day.cumulativeAmount;
        lastCumulativeForecast = day.cumulativeForecast;
        if (!day.isProjected) {
          hasActualData = true;
        }
      }
    });

    return {
      period: weekLabel,
      originalKey: format(weekStart, "yyyy-MM-dd"),
      amount: weekAmount,
      forecastAmount: weekForecast,
      cumulativeAmount: lastCumulativeAmount,
      cumulativeForecast: lastCumulativeForecast,
      isProjected: !hasActualData,
      variance: hasActualData ? weekAmount - weekForecast : undefined,
      budgetLine: chartData.budget ?? undefined,
    };
  });

  return {
    ...chartData,
    data: weeklyData,
  };
}

/**
 * Format amount for tooltip display
 */
export function formatAmountForTooltip(
  amount: number,
  currencySymbol: string = "$"
): string {
  return `${currencySymbol}${amount.toFixed(2)}`;
}

/**
 * Get variance indicator for tooltip
 */
export function getVarianceIndicator(variance: number): {
  icon: string;
  color: string;
  text: string;
} {
  if (variance > 0) {
    return {
      icon: "\u{2191}", // Up arrow
      color: "text-destructive",
      text: `$${Math.abs(variance).toFixed(2)} over forecast`,
    };
  } else if (variance < 0) {
    return {
      icon: "\u{2193}", // Down arrow
      color: "text-success",
      text: `$${Math.abs(variance).toFixed(2)} under forecast`,
    };
  }
  return {
    icon: "\u{2192}", // Right arrow
    color: "text-muted-foreground",
    text: "On track",
  };
}

/**
 * Calculate progress percentage toward budget
 */
export function calculateBudgetProgress(
  currentSpending: number,
  budget: number | null
): { percentage: number; status: "on-track" | "warning" | "over-budget" } {
  if (!budget || budget <= 0) {
    return { percentage: 0, status: "on-track" };
  }

  const percentage = (currentSpending / budget) * 100;

  let status: "on-track" | "warning" | "over-budget" = "on-track";
  if (percentage > 100) {
    status = "over-budget";
  } else if (percentage > 85) {
    status = "warning";
  }

  return { percentage, status };
}

/**
 * Get forecast accuracy metrics
 */
export function getForecastAccuracy(chartData: ForecastChartData): {
  meanAbsoluteError: number;
  accuracy: number;
  dataPoints: number;
} {
  const pastData = chartData.data.filter(
    (d) => !d.isProjected && d.variance !== undefined
  );

  if (pastData.length === 0) {
    return { meanAbsoluteError: 0, accuracy: 100, dataPoints: 0 };
  }

  const totalAbsError = pastData.reduce(
    (sum, d) => sum + Math.abs(d.variance || 0),
    0
  );
  const meanAbsoluteError = totalAbsError / pastData.length;

  // Calculate accuracy as percentage (inverse of relative error)
  const totalForecast = pastData.reduce((sum, d) => sum + d.forecastAmount, 0);
  const relativeError = totalForecast > 0 ? totalAbsError / totalForecast : 0;
  const accuracy = Math.max(0, Math.min(100, (1 - relativeError) * 100));

  return {
    meanAbsoluteError,
    accuracy,
    dataPoints: pastData.length,
  };
}

/**
 * Generate gradient stops for variance area
 */
export function getVarianceGradientStops(isPositive: boolean): string {
  if (isPositive) {
    return `
      <stop offset="0%" stopColor="${FORECAST_CHART_COLORS.varianceOver}" />
      <stop offset="100%" stopColor="${FORECAST_CHART_COLORS.varianceOver}" stopOpacity="0" />
    `;
  }
  return `
    <stop offset="0%" stopColor="${FORECAST_CHART_COLORS.varianceUnder}" />
    <stop offset="100%" stopColor="${FORECAST_CHART_COLORS.varianceUnder}" stopOpacity="0" />
  `;
}

/**
 * Determine the best X-axis tick interval based on data length
 */
export function getOptimalTickInterval(dataLength: number): number {
  if (dataLength <= 7) return 1;
  if (dataLength <= 14) return 2;
  if (dataLength <= 21) return 3;
  return 5;
}

/**
 * Filter data points for X-axis labels to avoid crowding
 */
export function getTickLabels(
  data: ForecastChartItem[],
  maxTicks: number = 7
): string[] {
  if (data.length <= maxTicks) {
    return data.map((d) => d.period);
  }

  const interval = Math.ceil(data.length / maxTicks);
  return data
    .filter((_, i) => i % interval === 0 || i === data.length - 1)
    .map((d) => d.period);
}
