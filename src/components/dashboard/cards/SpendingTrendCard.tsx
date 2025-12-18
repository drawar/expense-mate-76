// components/dashboard/cards/SpendingTrendCard.tsx
import React, { useState } from "react";
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Card from "./Card";
import { chartUtils } from "@/utils/dashboard";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
      year: "Quarterly"
    };
    return labels[period] || "Daily";
  };

  // Process data for chart
  const chartResult = React.useMemo(() => {
    return chartUtils.generateTimeSeriesData(transactions, {
      period: selectedPeriod,
      displayCurrency: currency,
      includeTrend: true,
      includeReimbursements: true
    });
  }, [transactions, selectedPeriod, currency]);

  // Extract data from chart result
  const chartData = chartResult?.data || [];
  const trend = chartResult?.trend || 0;
  const average = chartResult?.average || 0;
  
  // Create period selector
  const periodSelector = (
    <Select value={selectedPeriod} onValueChange={(value: string) => setSelectedPeriod(value as any)}>
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
          {formatCurrency(average)}
        </p>
      </div>
    </div>
  );
  
  // Define custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
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
        icon: <TrendingUpIcon className="h-8 w-8 text-muted-foreground mb-2" />
      }}
    >
      {chartData.length >= 2 && <TrendAndAverage />}
      
      {chartData.length > 0 && (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBar
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="period" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                fill="#8884d8"
                activeBar={{ fill: "#7171d6" }}
                radius={[4, 4, 0, 0]}
              />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      )}
      
      {chartData.length >= 2 && (
        <div className="mt-2 text-sm space-y-1">
          <div className="flex items-center gap-1">
            {trend >= 0 ? (
              <TrendingUpIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
            ) : (
              <TrendingDownIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            <span>
              Your spending {trend >= 0 ? "increased" : "decreased"} by {Math.abs(trend).toFixed(1)}% compared
              to last period
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default React.memo(SpendingTrendCard);
