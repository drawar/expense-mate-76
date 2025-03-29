// src/components/dashboard/charts/BarChart.tsx
import React, { useMemo } from 'react';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Currency } from '@/types';
import { formatCurrency } from '@/utils/formatting';
import { Transaction } from '@/types';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

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
 * Functional replacement for AbstractBarChart
 * Provides a reusable bar chart component for displaying time-based data
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
  // Process data for the chart
  const { chartData, trend, average, topCategories } = useMemo(() => {
    if (transactions.length === 0) {
      return { chartData: [], trend: 0, average: 0, topCategories: [] };
    }
    
    // Determine the grouping period based on selected time frame
    const periodMapping = {
      week: 'day',
      month: 'week',
      quarter: 'month',
      year: 'month'
    };
    
    const groupBy = periodMapping[period as keyof typeof periodMapping];
    
    // Group transactions by date
    const groupedTransactions = new Map<string, Transaction[]>();
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      let key: string;
      
      // Create the appropriate date key based on the grouping period
      switch (groupBy) {
        case 'day':
          key = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the start of the week (Sunday)
          const startOfWeek = new Date(txDate);
          startOfWeek.setDate(txDate.getDate() - txDate.getDay());
          key = startOfWeek.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = txDate.toISOString().split('T')[0];
      }
      
      if (!groupedTransactions.has(key)) {
        groupedTransactions.set(key, []);
      }
      
      groupedTransactions.get(key)?.push(tx);
    });
    
    // Get top categories for the most recent period
    const sortedKeys = Array.from(groupedTransactions.keys()).sort();
    const latestKey = sortedKeys[sortedKeys.length - 1];
    const latestTransactions = latestKey ? (groupedTransactions.get(latestKey) || []) : [];
    
    // Group by category for latest period
    const categoryMap = new Map<string, number>();
    latestTransactions.forEach(tx => {
      if (!tx.category) return;
      const existingAmount = categoryMap.get(tx.category) || 0;
      categoryMap.set(tx.category, existingAmount + tx.amount);
    });
    
    // Get top categories
    const topCats = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
    
    // Format keys for display
    const formatKey = (key: string, groupBy: string): string => {
      switch (groupBy) {
        case 'day':
          return new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        case 'week':
          const startDate = new Date(key);
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          return `${startDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString(undefined, { day: 'numeric' })}`;
        case 'month':
          const [year, month] = key.split('-');
          return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
        default:
          return key;
      }
    };
    
    // Process and format data for chart
    const data = sortedKeys.map(key => {
      const periodTransactions = groupedTransactions.get(key) || [];
      const total = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Get top categories for this period
      const periodCategoryMap = new Map<string, number>();
      periodTransactions.forEach(tx => {
        if (!tx.category) return;
        const existingAmount = periodCategoryMap.get(tx.category) || 0;
        periodCategoryMap.set(tx.category, existingAmount + tx.amount);
      });
      
      const periodTopCategories = Array.from(periodCategoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);
      
      return {
        period: formatKey(key, groupBy),
        amount: total,
        originalKey: key,
        topCategories: periodTopCategories
      };
    });
    
    // Calculate trend (percentage change)
    let calculatedTrend = 0;
    if (data.length >= 2) {
      const currentAmount = data[data.length - 1].amount;
      const previousAmount = data[data.length - 2].amount;
      
      if (previousAmount === 0) {
        calculatedTrend = currentAmount > 0 ? 100 : 0;
      } else {
        calculatedTrend = ((currentAmount - previousAmount) / previousAmount) * 100;
      }
    }
    
    // Calculate average
    const calculatedAverage = data.length > 0
      ? data.reduce((sum, item) => sum + item.amount, 0) / data.length
      : 0;
    
    return { 
      chartData: data, 
      trend: calculatedTrend, 
      average: calculatedAverage,
      topCategories: topCats
    };
  }, [transactions, period]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
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
                {data.topCategories.map((cat: any, index: number) => (
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
  
  // Generate spending insights
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
