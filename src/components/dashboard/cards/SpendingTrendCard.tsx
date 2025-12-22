// components/dashboard/cards/SpendingTrendCard.tsx
import React, { useState } from "react";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import Card from "./Card";
import { chartUtils } from "@/utils/dashboard";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import {
  LineChart,
  Line,
  XAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface SpendingTrendCardProps {
  transactions: Transaction[];
  currency?: Currency;
  initialPeriod?: "day" | "week" | "month" | "quarter";
  className?: string;
}

const SpendingTrendCard: React.FC<SpendingTrendCardProps> = ({
  transactions,
  currency = "SGD",
  initialPeriod = "week",
  className = "",
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
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

    return {
      dailyAvg,
      projectedTotal,
      daysRemaining,
    };
  }, [chartData, selectedPeriod]);

  // Create period selector
  const periodSelector = (
    <Select
      value={selectedPeriod}
      onValueChange={(value) =>
        setSelectedPeriod(value as "day" | "week" | "month" | "quarter")
      }
    >
      <SelectTrigger className="w-32 h-8">
        <span className="text-sm">{getPeriodLabel(selectedPeriod)}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">Daily</SelectItem>
        <SelectItem value="month">Weekly</SelectItem>
        <SelectItem value="quarter">Monthly</SelectItem>
        <SelectItem value="year">Quarterly</SelectItem>
      </SelectContent>
    </Select>
  );

  // Display trend and average section
  const TrendAndAverage = () => (
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm text-muted-foreground">vs last period</p>
        <div className="flex items-center gap-1 mt-1">
          {trend >= 0 ? (
            <TrendingUpIcon className="h-4 w-4 text-[var(--color-error)]" />
          ) : (
            <TrendingDownIcon className="h-4 w-4 text-[var(--color-success)]" />
          )}
          <span
            className={
              trend >= 0
                ? "font-medium text-[var(--color-error)]"
                : "font-medium text-[var(--color-success)]"
            }
          >
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm text-muted-foreground">
          {getPeriodLabel(selectedPeriod)} avg
        </p>
        <p className="font-medium mt-1">{formatCurrency(average)}</p>
      </div>
    </div>
  );

  // Define custom tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-primary text-lg font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
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
      {chartData.length >= 2 && <TrendAndAverage />}

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
          <span> by month end ({spendingPace.daysRemaining} days left)</span>
        </div>
      )}
    </Card>
  );
};

export default React.memo(SpendingTrendCard);
