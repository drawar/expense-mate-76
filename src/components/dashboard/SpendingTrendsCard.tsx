// src/components/dashboard/cards/SpendingTrendsCard.tsx
import React from 'react';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AbstractTrendCard, { 
  TrendCardProps 
} from '@/components/dashboard/abstractions/AbstractTrendCard';
import { formatCurrency } from '@/utils/currencyFormatter';

interface SpendingTrendsCardProps extends TrendCardProps {
  showAverage?: boolean;
}

/**
 * Specialized card for displaying spending trends over time
 * Extends AbstractTrendCard for trend analysis functionality
 */
class SpendingTrendsCard extends AbstractTrendCard<SpendingTrendsCardProps> {
  /**
   * Process transactions to extract trend data for spending analysis
   */
  protected processTrendData() {
    const { transactions, period = 'month' } = this.props;
    
    // Group transactions by month
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
        if (period === 'year') {
          displayDate += ` ${year}`;
        }
      }
      
      return {
        period: displayDate,
        originalKey: key,
        amount: total
      };
    });
    
    // Calculate month-over-month trend
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
   * Implement the abstract method to provide card-specific content
   */
  protected renderCardContent(): React.ReactNode {
    const { currency = 'SGD', showAverage = true } = this.props;
    const { chartData, trend } = this.processTrendData();
    
    // Format trend display
    const { text: trendText, color: trendColor } = this.formatTrendValue(trend);
    const TrendIcon = trend >= 0 ? TrendingUpIcon : TrendingDownIcon;
    
    // Check if we have enough data
    if (chartData.length < 2) {
      return (
        <div className="flex items-center justify-center h-60 text-muted-foreground">
          <p>Not enough data to display spending trends</p>
        </div>
      );
    }
    
    // Calculate average if needed
    const average = showAverage
      ? chartData.reduce((sum, item) => sum + item.amount, 0) / chartData.length
      : 0;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Trend</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon className={`h-4 w-4 ${trendColor}`} />
              <span className={`font-medium ${trendColor}`}>{trendText}</span>
            </div>
          </div>
          
          {showAverage && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="font-medium mt-1">
                {formatCurrency(average, currency)}
              </p>
            </div>
          )}
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
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
                tickFormatter={(value) => formatCurrency(value, currency, 0)}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value, currency), 'Spending']}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
}

/**
 * Factory function to create a SpendingTrendsCard with default props
 */
export const createSpendingTrendsCard = (
  transactions: Transaction[],
  period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  showAverage: boolean = true,
  currency: string = 'SGD',
  className: string = ''
) => {
  return (
    <SpendingTrendsCard
      title="Spending Trends"
      icon={TrendingUpIcon}
      transactions={transactions}
      period={period}
      showAverage={showAverage}
      currency={currency}
      className={className}
    />
  );
};

export default SpendingTrendsCard;
