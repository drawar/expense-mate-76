// src/hooks/dashboard/useForecast.ts
/**
 * Hook for generating spending forecasts with smart pattern detection
 */

import { useMemo } from "react";
import { Transaction, Currency } from "@/types";
import { TimeframeTab } from "@/utils/dashboard";
import { useBudget } from "@/hooks/useBudget";
import {
  forecastService,
  spenderProfiler,
  ForecastResult,
  ForecastOptions,
  ForecastChartData,
  ForecastDisplayMode,
} from "@/core/forecast";
import { format, isBefore, startOfDay } from "date-fns";

interface UseForecastOptions {
  /** Include holiday effects in forecast */
  includeHolidays?: boolean;
  /** Number of months to look back for patterns */
  historicalMonths?: number;
}

interface UseForecastReturn {
  /** The generated forecast result */
  forecast: ForecastResult | null;
  /** Chart data ready for rendering */
  chartData: ForecastChartData | null;
  /** Whether there's enough history for accurate forecasting */
  hasEnoughHistory: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Spender profile description */
  profileDescription: string;
  /** Projected total for the month */
  projectedTotal: number;
  /** Days remaining in month */
  daysRemaining: number;
  /** Current month name */
  monthName: string;
}

/**
 * Hook to generate spending forecasts for the dashboard
 *
 * @param transactions - All user transactions (filtered for currency)
 * @param currency - Display/forecast currency
 * @param timeframe - Current dashboard timeframe
 * @param options - Additional forecast options
 */
export function useForecast(
  transactions: Transaction[],
  currency: Currency,
  timeframe: TimeframeTab,
  options: UseForecastOptions = {}
): UseForecastReturn {
  const {
    scaledBudget,
    periodType,
    isLoading: budgetLoading,
  } = useBudget(currency, timeframe);

  const { includeHolidays = true, historicalMonths = 3 } = options;

  // Only generate forecast for "thisMonth" timeframe
  const shouldForecast = timeframe === "thisMonth";

  const forecast = useMemo(() => {
    if (!shouldForecast || transactions.length === 0) {
      return null;
    }

    const forecastOptions: ForecastOptions = {
      currency,
      budget: scaledBudget > 0 ? scaledBudget : undefined,
      budgetPeriod: periodType,
      includeHolidays,
      historicalMonths,
      targetMonth: new Date(),
    };

    return forecastService.generateForecast(transactions, forecastOptions);
  }, [
    shouldForecast,
    transactions,
    currency,
    scaledBudget,
    periodType,
    includeHolidays,
    historicalMonths,
  ]);

  // Generate chart data
  const chartData = useMemo(() => {
    if (!forecast) return null;

    const today = startOfDay(new Date());

    const data = forecast.dailyForecasts.map((day) => {
      // Parse YYYY-MM-DD as local date, not UTC
      // new Date("2026-01-03") interprets as UTC midnight, which becomes
      // the previous day in Pacific time. Instead, parse the parts.
      const [year, month, dayNum] = day.date.split("-").map(Number);
      const date = new Date(year, month - 1, dayNum); // month is 0-indexed
      const isPast =
        isBefore(date, today) || day.date === format(today, "yyyy-MM-dd");

      return {
        period: format(date, "MMM d"),
        originalKey: day.date,
        amount: day.actualAmount ?? 0,
        forecastAmount: day.forecastAmount,
        cumulativeAmount: day.cumulativeActual ?? 0,
        cumulativeForecast: day.cumulativeForecast,
        isProjected: !isPast,
        variance: isPast
          ? (day.actualAmount ?? 0) - day.forecastAmount
          : undefined,
        budgetLine: forecast.budget ?? undefined,
      };
    });

    return {
      data,
      budget: forecast.budget,
      projection: forecast.monthlyProjection,
      spenderProfile: forecast.spenderProfile,
      confidence: forecast.confidence,
      isFirstMonth: forecast.isFirstMonth,
    };
  }, [forecast]);

  // Calculate days remaining and month name
  const { daysRemaining, monthName, projectedTotal } = useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const remaining = endOfMonth.getDate() - now.getDate();
    const month = format(now, "MMMM");
    const projection = forecast?.monthlyProjection ?? 0;

    return {
      daysRemaining: remaining,
      monthName: month,
      projectedTotal: projection,
    };
  }, [forecast]);

  // Get profile description
  const profileDescription = useMemo(() => {
    if (!forecast) return "";
    return spenderProfiler.getProfileDescription(forecast.spenderProfile);
  }, [forecast]);

  return {
    forecast,
    chartData,
    hasEnoughHistory: forecast ? !forecast.isFirstMonth : false,
    isLoading: budgetLoading,
    profileDescription,
    projectedTotal,
    daysRemaining,
    monthName,
  };
}

/**
 * Transform forecast data for different display modes
 */
export function transformForecastForDisplay(
  chartData: ForecastChartData,
  mode: ForecastDisplayMode
): ForecastChartData {
  if (mode === "cumulative") {
    // Already includes cumulative data
    return chartData;
  }

  // For daily mode, the data is already in the right format
  return chartData;
}

/**
 * Aggregate forecast data by week
 */
export function aggregateForecastByWeek(
  chartData: ForecastChartData
): ForecastChartData {
  const weeklyData: Map<
    string,
    {
      amount: number;
      forecastAmount: number;
      cumulativeAmount: number;
      cumulativeForecast: number;
      isProjected: boolean;
    }
  > = new Map();

  chartData.data.forEach((day, index) => {
    const weekNum = Math.floor(index / 7);
    const weekKey = `Week ${weekNum + 1}`;

    const existing = weeklyData.get(weekKey) || {
      amount: 0,
      forecastAmount: 0,
      cumulativeAmount: 0,
      cumulativeForecast: 0,
      isProjected: true,
    };

    weeklyData.set(weekKey, {
      amount: existing.amount + day.amount,
      forecastAmount: existing.forecastAmount + day.forecastAmount,
      cumulativeAmount: day.cumulativeAmount, // Use last day's cumulative
      cumulativeForecast: day.cumulativeForecast,
      isProjected: existing.isProjected && day.isProjected,
    });
  });

  const aggregatedData = Array.from(weeklyData.entries()).map(
    ([period, data]) => ({
      period,
      originalKey: period,
      ...data,
      variance: !data.isProjected
        ? data.amount - data.forecastAmount
        : undefined,
      budgetLine: chartData.budget ?? undefined,
    })
  );

  return {
    ...chartData,
    data: aggregatedData,
  };
}
