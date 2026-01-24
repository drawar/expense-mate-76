// components/dashboard/cards/SpendingOverviewCard.tsx
/**
 * Combined spending overview card showing:
 * - Total spent with large amount
 * - Date range
 * - Cumulative spending chart with budget target and projection
 */

import React, { useMemo, useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfDay,
  subMonths,
  startOfYear,
  endOfYear,
  parseISO,
} from "date-fns";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { Transaction } from "@/types";
import NumberFlow from "@number-flow/react";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { useBudget } from "@/hooks/useBudget";
import { useForecast } from "@/hooks/dashboard/useForecast";
import { CurrencyService } from "@/core/currency/CurrencyService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";

interface SpendingOverviewCardProps {
  className?: string;
}

const SpendingOverviewCard: React.FC<SpendingOverviewCardProps> = ({
  className = "",
}) => {
  const {
    transactions,
    filteredTransactions,
    displayCurrency,
    activeTab,
    dashboardData,
  } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Get budget
  const { scaledBudget } = useBudget(displayCurrency, activeTab);

  // Get forecast data
  const { forecast, chartData: forecastChartData } = useForecast(
    transactions,
    displayCurrency,
    activeTab
  );

  // Calculate date range based on active time filter
  const { dateRange, periodLabel } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;
    let label: string;

    switch (activeTab) {
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        label = "this month";
        break;
      case "lastMonth":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        label = "last month";
        break;
      case "lastTwoMonths":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(now);
        label = "last 2 months";
        break;
      case "lastThreeMonths":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        label = "last 3 months";
        break;
      case "lastSixMonths":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        label = "last 6 months";
        break;
      case "thisYear":
        start = startOfYear(now);
        end = endOfYear(now);
        label = "this year";
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
        label = "this month";
    }

    return {
      dateRange: {
        start: format(start, "MMM d, yyyy"),
        end: format(end, "MMM d, yyyy"),
        startISO: format(start, "yyyy-MM-dd"),
        endISO: format(end, "yyyy-MM-dd"),
      },
      periodLabel: label,
    };
  }, [activeTab]);

  // Get net expenses
  const metrics = dashboardData?.metrics || {
    totalExpenses: 0,
    totalReimbursed: 0,
  };
  const actualNetExpenses =
    (metrics.totalExpenses || 0) - (metrics.totalReimbursed || 0);

  // Animate from 0 on mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const netExpenses = mounted ? actualNetExpenses : 0;

  // Calculate today's spending
  const todaySpending = useMemo(() => {
    if (!filteredTransactions || filteredTransactions.length === 0) return 0;

    const today = startOfDay(new Date());
    let total = 0;

    filteredTransactions.forEach((tx) => {
      const txDate = startOfDay(new Date(tx.date));
      if (txDate.getTime() === today.getTime() && tx.amount > 0) {
        const grossAmount = CurrencyService.convert(
          tx.paymentAmount ?? tx.amount,
          tx.paymentCurrency ?? tx.currency,
          displayCurrency
        );
        const reimbursed = tx.reimbursementAmount
          ? CurrencyService.convert(
              tx.reimbursementAmount,
              tx.paymentCurrency ?? tx.currency,
              displayCurrency
            )
          : 0;
        total += grossAmount - reimbursed;
      }
    });

    return total;
  }, [filteredTransactions, displayCurrency]);

  // Calculate budget pace variance and dynamic line color
  const { spendingLineColor, varianceRatio } = useMemo(() => {
    // Japandi colors
    const greenColor = { r: 56, g: 102, b: 65 }; // #386641
    const redColor = { r: 188, g: 71, b: 73 }; // #bc4749

    // If no budget set, use green
    if (scaledBudget <= 0) {
      return { spendingLineColor: "#386641", varianceRatio: 0 };
    }

    // Calculate expected spend at current point in month
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate();
    const currentDay = now.getDate();
    const expectedSpend = (scaledBudget / daysInMonth) * currentDay;

    // Calculate variance ratio (how much over/under expected pace)
    // ratio = 1 means on pace, >1 means over, <1 means under
    const ratio = expectedSpend > 0 ? netExpenses / expectedSpend : 0;

    // Interpolate color based on variance
    // 0-100% of expected = full green
    // 100-150% of expected = gradient green to red
    // >150% of expected = full red
    let t = 0; // interpolation factor (0 = green, 1 = red)
    if (ratio <= 1) {
      t = 0; // On or under budget pace - green
    } else if (ratio >= 1.5) {
      t = 1; // 50%+ over budget pace - red
    } else {
      // Linear interpolation between 100% and 150%
      t = (ratio - 1) / 0.5;
    }

    // Interpolate RGB values
    const r = Math.round(greenColor.r + t * (redColor.r - greenColor.r));
    const g = Math.round(greenColor.g + t * (redColor.g - greenColor.g));
    const b = Math.round(greenColor.b + t * (redColor.b - greenColor.b));

    const color = `rgb(${r}, ${g}, ${b})`;
    return { spendingLineColor: color, varianceRatio: ratio };
  }, [netExpenses, scaledBudget]);

  // Prepare cumulative chart data
  const chartData = useMemo(() => {
    const isCurrentMonth = activeTab === "thisMonth";

    // For current month, use forecast data
    if (isCurrentMonth && forecastChartData?.data) {
      const today = startOfDay(new Date());
      const currentDay = today.getDate();

      return forecastChartData.data.map((item) => {
        const [, , dayStr] = item.originalKey.split("-");
        const day = parseInt(dayStr, 10);

        return {
          day,
          period: item.period,
          actual: day <= currentDay ? item.cumulativeAmount : null,
          projected: day >= currentDay ? item.cumulativeForecast : null,
          isProjected: item.isProjected,
          originalKey: item.originalKey,
        };
      });
    }

    // For other time periods, generate cumulative data from filtered transactions
    if (!filteredTransactions || filteredTransactions.length === 0) return [];

    // Group transactions by date and calculate cumulative spending
    const spendingByDate = new Map<string, number>();

    filteredTransactions
      .filter((tx) => tx.amount > 0)
      .forEach((tx) => {
        const dateKey = tx.date.split("T")[0];
        const amount = CurrencyService.convert(
          tx.paymentAmount ?? tx.amount,
          tx.paymentCurrency ?? tx.currency,
          displayCurrency
        );
        const reimbursed = tx.reimbursementAmount
          ? CurrencyService.convert(
              tx.reimbursementAmount,
              tx.paymentCurrency ?? tx.currency,
              displayCurrency
            )
          : 0;
        spendingByDate.set(
          dateKey,
          (spendingByDate.get(dateKey) || 0) + amount - reimbursed
        );
      });

    // Sort dates and build cumulative data
    const sortedDates = Array.from(spendingByDate.keys()).sort();
    let cumulative = 0;

    return sortedDates.map((dateKey, index) => {
      cumulative += spendingByDate.get(dateKey) || 0;
      return {
        day: index + 1,
        period: format(new Date(dateKey), "MMM d"),
        actual: cumulative,
        projected: null,
        isProjected: false,
        originalKey: dateKey,
      };
    });
  }, [forecastChartData, activeTab, filteredTransactions, displayCurrency]);

  // Find the last actual data point for smooth transition
  const lastActualPoint = useMemo(() => {
    if (!chartData.length) return null;
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].actual !== null) {
        return chartData[i];
      }
    }
    return null;
  }, [chartData]);

  // Calculate top spending days directly from transactions
  interface SpikeDayInfo {
    day: number;
    date: string;
    amount: number;
    transactions: Transaction[];
  }

  const topSpendingDays = useMemo((): SpikeDayInfo[] => {
    if (!filteredTransactions?.length) return [];

    // Helper to get net amount converted to display currency
    const getNetAmountInDisplayCurrency = (tx: Transaction): number => {
      const gross = CurrencyService.convert(
        tx.paymentAmount ?? tx.amount,
        tx.paymentCurrency ?? tx.currency,
        displayCurrency
      );
      const reimbursed = tx.reimbursementAmount
        ? CurrencyService.convert(
            tx.reimbursementAmount,
            tx.paymentCurrency ?? tx.currency,
            displayCurrency
          )
        : 0;
      return gross - reimbursed;
    };

    // Group transactions by date and calculate daily totals
    const dailyData = new Map<
      string,
      { amount: number; transactions: Transaction[] }
    >();

    filteredTransactions.forEach((tx) => {
      // Parse date as local time to match forecast data
      // tx.date might be UTC, so convert to local date string
      const txDate = new Date(tx.date);
      const dateKey = format(txDate, "yyyy-MM-dd");
      // Include both positive and negative amounts, minus reimbursements
      const netAmount = getNetAmountInDisplayCurrency(tx);

      const existing = dailyData.get(dateKey) || {
        amount: 0,
        transactions: [],
      };
      dailyData.set(dateKey, {
        amount: existing.amount + netAmount,
        // Only include transactions with positive net spending for display
        transactions:
          netAmount > 0
            ? [...existing.transactions, tx]
            : existing.transactions,
      });
    });

    // Convert to array and sort by amount descending
    const sortedDays = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        day: parseInt(date.split("-")[2], 10), // Extract day number
        amount: data.amount,
        transactions: data.transactions.sort((a, b) => {
          // Sort transactions by net amount descending
          return (
            getNetAmountInDisplayCurrency(b) - getNetAmountInDisplayCurrency(a)
          );
        }),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3)
      .filter((d) => d.amount > 50); // Only show days with significant spending

    return sortedDays;
  }, [filteredTransactions, displayCurrency]);

  // Map date strings to spike index (1, 2, 3) for numbered markers
  const spikeDateToIndex = useMemo(() => {
    const map = new Map<string, number>();
    topSpendingDays.forEach((d, i) => map.set(d.date, i + 1));
    return map;
  }, [topSpendingDays]);

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
      payload?: { isProjected?: boolean };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const actualPayload = payload.find((p) => p.dataKey === "actual");
      const projectedPayload = payload.find((p) => p.dataKey === "projected");
      const value = actualPayload?.value ?? projectedPayload?.value ?? 0;
      const isProjected = projectedPayload && !actualPayload?.value;

      return (
        <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md text-sm">
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="font-medium">
            {formatCurrency(value)}
            {isProjected && (
              <span className="text-sm text-muted-foreground ml-1">
                (projected)
              </span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate projected end amount
  const projectedEndAmount = useMemo(() => {
    if (!chartData.length) return 0;
    const lastPoint = chartData[chartData.length - 1];
    return lastPoint?.projected ?? lastPoint?.actual ?? 0;
  }, [chartData]);

  // Custom label for budget target line with pill background
  const BudgetLabel = ({
    viewBox,
  }: {
    viewBox?: { x?: number; y?: number };
  }) => {
    if (!viewBox || viewBox.x === undefined || viewBox.y === undefined)
      return null;
    const labelText = `${formatCurrency(scaledBudget)} target`;
    const labelWidth = labelText.length * 9 + 28;
    const labelHeight = 30;

    return (
      <g>
        <rect
          x={viewBox.x + 10}
          y={viewBox.y - labelHeight / 2}
          width={labelWidth}
          height={labelHeight}
          rx={labelHeight / 2}
          fill="#6b7280"
        />
        <text
          x={viewBox.x + 10 + labelWidth / 2}
          y={viewBox.y + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={14}
          fontWeight={500}
        >
          {labelText}
        </text>
      </g>
    );
  };

  return (
    <Card className={`${className} h-full`}>
      <CardContent className="pt-6 h-full flex flex-col">
        {/* Header with total spent */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm text-muted-foreground">You've spent</p>
            <p className="text-4xl font-semibold tracking-tight mt-1">
              <NumberFlow
                value={netExpenses}
                format={{
                  style: "currency",
                  currency: displayCurrency,
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }}
              />
            </p>
            {todaySpending > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                of which{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(todaySpending)}
                </span>{" "}
                today
              </p>
            )}
          </div>
          <div className="text-right">
            <Link
              to={`/transactions?from=${dateRange.startISO}&to=${dateRange.endISO}`}
              className="group flex items-center gap-1 text-sm text-primary justify-end"
            >
              <span className="relative">
                View transactions
                <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full" />
              </span>
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>

            {/* Top spending days callout - horizontal badges */}
            {topSpendingDays.length > 0 && (
              <div className="mt-3 flex gap-1.5 w-[150%] -ml-[25%]">
                {topSpendingDays.slice(0, 3).map((spike, index) => {
                  if (!spike.transactions.length) return null;

                  // Aggregate transactions by merchant + currency
                  const merchantTotals = new Map<
                    string,
                    {
                      merchantName: string;
                      currency: Currency;
                      totalOriginal: number;
                      totalConverted: number;
                    }
                  >();

                  spike.transactions.forEach((tx) => {
                    const key = `${tx.merchant.id}-${tx.currency}`;
                    const netOriginal =
                      tx.amount - (tx.reimbursementAmount ?? 0);
                    const netConverted = CurrencyService.convert(
                      netOriginal,
                      tx.currency,
                      displayCurrency
                    );

                    const existing = merchantTotals.get(key);
                    if (existing) {
                      existing.totalOriginal += netOriginal;
                      existing.totalConverted += netConverted;
                    } else {
                      merchantTotals.set(key, {
                        merchantName: tx.merchant.name,
                        currency: tx.currency,
                        totalOriginal: netOriginal,
                        totalConverted: netConverted,
                      });
                    }
                  });

                  // Find merchant with largest total (by converted amount)
                  const topMerchant = Array.from(merchantTotals.values()).sort(
                    (a, b) => b.totalConverted - a.totalConverted
                  )[0];

                  if (!topMerchant) return null;

                  const spikeNumber = index + 1;

                  return (
                    <div
                      key={spike.date}
                      className="flex-1 min-w-0 bg-muted/50 rounded-lg px-2 py-1.5 text-center"
                    >
                      {/* Numbered badge */}
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center">
                          {spikeNumber}
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          +
                          {CurrencyService.format(
                            topMerchant.totalOriginal,
                            topMerchant.currency
                          )}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {topMerchant.merchantName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="flex-1 min-h-[12rem]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
              >
                <XAxis
                  dataKey="day"
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                  tick={{ fontSize: 14, fill: "#9ca3af" }}
                  tickFormatter={(value) => `${value}`}
                  interval="preserveStartEnd"
                />

                <YAxis hide domain={[0, "auto"]} />

                {/* Budget target line */}
                {scaledBudget > 0 && (
                  <ReferenceLine
                    key={`budget-${scaledBudget}`}
                    y={scaledBudget}
                    stroke="#6b7280"
                    strokeWidth={2}
                    label={<BudgetLabel />}
                  />
                )}

                <Tooltip content={<CustomTooltip />} />

                {/* Projected spending line (dashed) - only for current month */}
                {activeTab === "thisMonth" && (
                  <Line
                    type="monotone"
                    dataKey="projected"
                    stroke="#9ca3af"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls={false}
                    name="Projected"
                  />
                )}

                {/* Actual spending line (solid) - dynamic color based on budget pace */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke={spendingLineColor}
                  strokeWidth={2.5}
                  dot={(props: {
                    cx?: number;
                    cy?: number;
                    payload?: {
                      day: number;
                      actual: number | null;
                      originalKey: string;
                    };
                  }) => {
                    if (!props.payload || props.payload.actual === null)
                      return <></>;

                    const isLastActual =
                      props.payload.day === lastActualPoint?.day;
                    const spikeIndex = spikeDateToIndex.get(
                      props.payload.originalKey
                    );

                    // Show numbered marker for spike days
                    if (spikeIndex && !isLastActual) {
                      return (
                        <g>
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={8}
                            fill="#f59e0b"
                            stroke="#fff"
                            strokeWidth={2}
                          />
                          <text
                            x={props.cx}
                            y={props.cy}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#fff"
                            fontSize={10}
                            fontWeight={600}
                          >
                            {spikeIndex}
                          </text>
                        </g>
                      );
                    }

                    if (isLastActual) {
                      return (
                        <circle
                          cx={props.cx}
                          cy={props.cy}
                          r={6}
                          fill={spendingLineColor}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      );
                    }

                    return <></>;
                  }}
                  activeDot={{
                    fill: spendingLineColor,
                    strokeWidth: 2,
                    stroke: "#fff",
                    r: 6,
                  }}
                  connectNulls={false}
                  name="Actual"
                />

                {/* End point marker for projection - only for current month */}
                {activeTab === "thisMonth" &&
                  projectedEndAmount > 0 &&
                  chartData.length > 0 && (
                    <Line
                      type="monotone"
                      dataKey={(d: (typeof chartData)[0]) =>
                        d.day === chartData[chartData.length - 1].day
                          ? d.projected
                          : null
                      }
                      stroke="transparent"
                      dot={{
                        fill: "#fff",
                        stroke: "#9ca3af",
                        strokeWidth: 2,
                        r: 5,
                      }}
                    />
                  )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-[#6b7280]" />
            <span>Budget</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-0.5"
              style={{ backgroundColor: spendingLineColor }}
            />
            <span>Actual</span>
          </div>
          {activeTab === "thisMonth" && (
            <div className="flex items-center gap-1.5">
              <div
                className="w-4 h-0.5"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, #9ca3af 0, #9ca3af 4px, transparent 4px, transparent 8px)",
                }}
              />
              <span>Forecast</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendingOverviewCard);
