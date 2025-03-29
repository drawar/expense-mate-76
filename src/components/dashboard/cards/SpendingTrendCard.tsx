// src/components/dashboard/cards/SpendingTrendCard.tsx
import React, { useState, useMemo } from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { Transaction, Currency } from '@/types';
import { BarChart } from '@/components/dashboard/charts/BarChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/utils/formatting';

interface SpendingTrendCardProps {
  title?: string;
  transactions: Transaction[];
  currency?: Currency;
  initialPeriod?: 'week' | 'month' | 'quarter' | 'year';
  className?: string;
}

/**
 * A specialized card for displaying spending trends over time with period selection
 * Mimics the implementation of SpendingTrendChart but as a functional component
 */
const SpendingTrendCard: React.FC<SpendingTrendCardProps> = ({
  title = 'Spending Trends',
  transactions,
  currency = 'SGD',
  initialPeriod = 'month',
  className = ''
}) => {
  // State for selected period
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  
  // Apply domain-specific colors for spending trends
  const spendingBarColor = '#8884d8';
  const spendingHoverColor = '#7171d6';
  
  // Process transactions for spending trends analysis
  const { chartData, trend, average, topCategories } = useMemo(() => {
    // Function to get top spending categories for a set of transactions
    const getTopCategoriesForPeriod = (transactions: Transaction[]): Array<{ category: string; amount: number }> => {
      // Group by category
      const categoryMap = new Map<string, number>();
      
      transactions.forEach(tx => {
        if (!tx.category) return;
        
        const existingAmount = categoryMap.get(tx.category) || 0;
        categoryMap.set(tx.category, existingAmount + tx.amount);
      });
      
      // Convert to array and sort by amount (descending)
      const categories = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
      
      return categories.slice(0, 3); // Return top 3 categories
    };

    if (transactions.length === 0) {
      return { chartData: [], trend: 0, average: 0, topCategories: [] };
    }
    
    // Determine the grouping period based on selected time frame
    // This mimics the implementation from SpendingTrendChart
    const periodMapping = {
      week: 'day',
      month: 'week',
      quarter: 'month',
      year: 'month'
    };
    
    // Group transactions by date
    const groupedTransactions = new Map<string, Transaction[]>();
    
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      let key: string;
      
      // Create the appropriate date key based on the grouping period
      const groupBy = periodMapping[selectedPeriod];
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
    
    // Get top categories
    const topCats = getTopCategoriesForPeriod(latestTransactions);
    
    // Format keys for display
    const processedChartData = sortedKeys.map(key => {
      const periodTransactions = groupedTransactions.get(key) || [];
      const total = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Get top categories for this period
      const periodTopCategories = getTopCategoriesForPeriod(periodTransactions);
      
      // Format the key for display (mimicking the original implementation)
      let displayDate = key;
      if (periodMapping[selectedPeriod] === 'week') {
        // For weeks, show date range
        const startDate = new Date(key);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        displayDate = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
      } else if (periodMapping[selectedPeriod] === 'month') {
        // For months, show month name
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        displayDate = date.toLocaleString('default', { month: 'short' });
        if (selectedPeriod === 'year') {
          displayDate += ` ${year}`;
        }
      }
      
      return {
        period: displayDate,
        amount: total,
        originalKey: key,
        topCategories: periodTopCategories
      };
    });
    
    // Calculate trend (period-over-period change)
    let calculatedTrend = 0;
    if (processedChartData.length >= 2) {
      const currentAmount = processedChartData[processedChartData.length - 1].amount;
      const previousAmount = processedChartData[processedChartData.length - 2].amount;
      
      if (previousAmount === 0) {
        calculatedTrend = currentAmount > 0 ? 100 : 0;
      } else {
        calculatedTrend = ((currentAmount - previousAmount) / previousAmount) * 100;
      }
    }
    
    // Calculate average
    const calculatedAverage = processedChartData.length > 0
      ? processedChartData.reduce((sum, item) => sum + item.amount, 0) / processedChartData.length
      : 0;
    
    return { 
      chartData: processedChartData, 
      trend: calculatedTrend, 
      average: calculatedAverage,
      topCategories: topCats
    };
  }, [transactions, selectedPeriod]);

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
  
  // Handle period change
  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as 'week' | 'month' | 'quarter' | 'year');
  };
  
  // Return the custom card with period selector and trends
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          
          {/* Period Selector Dropdown - mimicking the original */}
          <Select 
            value={selectedPeriod} 
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Display trend and average */}
        {chartData.length >= 2 && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Trend</p>
              <div className="flex items-center gap-1 mt-1">
                {trend >= 0 ? (
                  <TrendingUpIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                )}
                <span className={trend >= 0 
                  ? "font-medium text-red-600 dark:text-red-400"
                  : "font-medium text-green-600 dark:text-green-400"
                }>
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="font-medium mt-1">
                {formatCurrency(average, currency)}
              </p>
            </div>
          </div>
        )}
        
        {/* Use the BarChart component for visualization */}
        <BarChart
          title=""
          transactions={transactions}
          period={selectedPeriod}
          currency={currency}
          barColor={spendingBarColor}
          hoverColor={spendingHoverColor}
          showInsights={false} // We handle insights separately
        />
        
        {/* Show insights below the chart */}
        {chartData.length >= 2 && renderInsights()}
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendingTrendCard);
