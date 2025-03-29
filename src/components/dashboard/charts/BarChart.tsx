// src/components/dashboard/charts/BarChart.tsx
import React, { useMemo } from 'react';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency } from '@/types';
import { formatCurrency } from '@/utils/formatting';
import { Transaction } from '@/types';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { 
  processTransactionsForChart, 
  ProcessedChartItem,
  calculatePercentageChange 
} from '@/utils/chartDataProcessor';

export interface BarChartProps {
  title: string;
  icon?: React.ReactNode;
  transactions: Transaction[];
  period?: 'week' | 'month' | 'quarter' | 'year';
  currency?: Currency;
  barColor?: string;
  hoverColor?: string;
  className?: string;
  showInsights?: boolean;
}

/**
 * Reusable bar chart component for displaying time-based data
 * Uses consolidated chart processing utility for consistent formatting
 */
const BarChart: React.FC<BarChartProps> = ({
  title,
  icon,
  transactions,
  period = 'month',
  currency = 'SGD',
  barColor = '#8884d8',
  hoverColor = '#7171d6',
  className = '',
  showInsights = true
}) => {
  // Process data for the chart using our utility
  const { chartData, trend, average, topCategories } = useMemo(() => {
    return processTransactionsForChart(transactions, {
      period,
      includeCategoryBreakdown: true,
      maxTopCategories: 3,
      includeTrend: true
    });
  }, [transactions, period]);
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ProcessedChartItem;
      
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md max-w-xs">
          <p className="font-medium">{label}</p>
          <p className="text-primary text-lg font-semibold">
            {formatCurrency(payload[0].value, currency)}
          </p>
          
          {showInsights && data.topCategories && data.topCategories.length > 0 && (
            <>
              <p className="mt-2 font-medium text-xs text-muted-foreground">Top Categories:</p>
              <div className="mt-1 space-y-1">
                {data.topCategories.map((cat, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{cat.category}</span>
                    <span>{formatCurrency(cat.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Generate spending insights component
  const renderInsights = () => {
    if (chartData.length < 2) {
      return <p>Not enough data for meaningful insights</p>;
    }
    
    const trendType = trend >= 0 ? 'increase' : 'decrease';
    const trendIcon = trend >= 0 ? (
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
            Your spending {trendType}d by {Math.abs(trend).toFixed(1)}% compared to last period
          </span>
        </div>
        
        {topCategory && (
          <p className="text-muted-foreground">
            Highest spending: {formatCurrency(topCategory.amount, currency)} on {topCategory.category}
          </p>
        )}
      </div>
    );
  };
  
  // Empty state
  if (chartData.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>No data available for this period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                tickFormatter={(value) => formatCurrency(value, currency)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="amount" 
                fill={barColor}
                activeBar={{ fill: hoverColor }}
                radius={[4, 4, 0, 0]}
              />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
        
        {/* Show insights if enabled */}
        {showInsights && renderInsights()}
      </CardContent>
    </Card>
  );
};

// Export both as named export and default export for flexibility
export { BarChart };
export default React.memo(BarChart);
