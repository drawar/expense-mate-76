// src/components/dashboard/charts/SpendingTrendChart.tsx
import React from 'react';
import AbstractBarChart, { BarChartProps } from '@/components/dashboard/abstractions/AbstractBarChart';
import { formatCurrency } from '@/utils/currencyFormatter';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { ChartTooltipProps } from '@/components/dashboard/tooltips/ChartTooltip';
import { Transaction } from '@/types';

interface SpendingTrendChartProps extends BarChartProps {
  showInsights?: boolean;
  insightCategories?: string[];
}

/**
 * Specialized bar chart for displaying spending trends with 
 * insights and recommendations
 */
class SpendingTrendChart extends AbstractBarChart<SpendingTrendChartProps> {
  /**
   * Process transactions to extract chart data for spending analysis
   */
  protected processChartData() {
    const { transactions, period = 'month' } = this.props;
    
    // Determine the grouping period based on selected time frame
    const periodMapping = {
      week: 'day',
      month: 'week',
      quarter: 'month',
      year: 'month'
    };
    
    const groupedTransactions = this.groupTransactionsByPeriod(
      transactions, 
      periodMapping[period] as 'day' | 'week' | 'month' | 'year'
    );
    
    // Convert to array for chart data
    const sortedKeys = Array.from(groupedTransactions.keys()).sort();
    
    const chartData = sortedKeys.map(key => {
      const periodTransactions = groupedTransactions.get(key) || [];
      const total = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      // Generate insights for this period if enabled
      const topCategories = this.getTopCategoriesForPeriod(periodTransactions);
      
      // Format the key for display
      let displayDate = key;
      if (periodMapping[period] === 'week') {
        // For weeks, show date range
        const startDate = new Date(key);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        displayDate = `${startDate.getDate()}/${startDate.getMonth() + 1} - ${endDate.getDate()}/${endDate.getMonth() + 1}`;
      } else if (periodMapping[period] === 'month') {
        // For months, show month name
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        displayDate = date.toLocaleString('default', { month: 'short' });
        if (period === 'quarter') {
          displayDate += ` ${year}`;
        }
      }
      
      return {
        period: displayDate,
        originalKey: key,
        amount: total,
        topCategories: topCategories,
      };
    });
    
    // Calculate trend (period-over-period change)
    let trend = 0;
    if (chartData.length >= 2) {
      const currentAmount = chartData[chartData.length - 1].amount;
      const previousAmount = chartData[chartData.length - 2].amount;
      trend = this.calculatePercentageChange(currentAmount, previousAmount);
    }
    
    return {
      chartData,
      trend
    };
  }
  
  /**
   * Get top spending categories for a set of transactions
   */
  private getTopCategoriesForPeriod(transactions: Transaction[]): Array<{ category: string; amount: number }> {
    const { insightCategories = [] } = this.props;
    
    // Group by category
    const categoryMap = new Map<string, number>();
    
    transactions.forEach(tx => {
      if (!tx.category) return;
      
      const existingAmount = categoryMap.get(tx.category) || 0;
      categoryMap.set(tx.category, existingAmount + tx.amount);
    });
    
    // Convert to array and sort by amount (descending)
    let categories = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
    
    // Filter to specified categories if provided
    if (insightCategories.length > 0) {
      categories = categories.filter(item => insightCategories.includes(item.category));
    }
    
    return categories.slice(0, 3); // Return top 3 categories
  }
  
  /**
   * Generate spending insights based on the data
   */
  private generateInsights(): React.ReactNode {
    const { chartData, trend } = this.processChartData();
    const { currency = 'USD' } = this.props;
    
    if (chartData.length < 2) {
      return <p>Not enough data for meaningful insights</p>;
    }
    
    const currentPeriod = chartData[chartData.length - 1];
    const previousPeriod = chartData[chartData.length - 2];
    
    const trendType = trend >= 0 ? 'increase' : 'decrease';
    const trendIcon = trend >= 0 ? (
      <TrendingUpIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
    ) : (
      <TrendingDownIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
    );
    
    // Find the highest spending category
    const topCategory = currentPeriod.topCategories?.[0];
    
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
  }
  
  /**
   * Override the base tooltip to include category insights
   */
  protected renderCustomTooltip(props: ChartTooltipProps): React.ReactNode {
    const { active, payload, label } = props;
    const { currency = 'USD', showInsights = true } = this.props;
    
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
  }
  
  /**
   * Render the chart with insights
   */
  render() {
    const { showInsights = true } = this.props;
    const chartContent = super.render();
    
    return (
      <div className="space-y-2">
        {chartContent}
        {showInsights && this.generateInsights()}
      </div>
    );
  }
}

export default SpendingTrendChart;
