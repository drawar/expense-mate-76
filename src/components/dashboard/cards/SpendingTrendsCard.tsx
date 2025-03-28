// src/components/dashboard/SpendingTrendsCard.tsx
import React from 'react';
import { TrendingUpIcon, TrendingDownIcon, InfoIcon } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import AbstractFinancialInsightCard, { 
  FinancialInsightCardProps 
} from '@/components/dashboard/abstractions/AbstractFinancialInsightCard';
import SpendingTrendChart from '@/components/dashboard/charts/SpendingTrendChart';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Transaction } from '@/types';

interface SpendingTrendsCardProps extends FinancialInsightCardProps {
  transactions: Transaction[];
  period?: 'week' | 'month' | 'quarter' | 'year';
  showAverage?: boolean;
  showInsights?: boolean;
  currency?: string;
}

/**
 * Specialized card for displaying spending trends over time
 * Inherits from AbstractFinancialInsightCard for consistent styling
 * and contains a SpendingTrendChart for visualization
 */
class SpendingTrendsCard extends AbstractFinancialInsightCard<SpendingTrendsCardProps> {
  state = {
    selectedPeriod: this.props.period || 'month'
  };
  
  /**
   * Process transactions to extract trend data for spending analysis
   */
  private processTrendData() {
    const { transactions } = this.props;
    const { selectedPeriod } = this.state;
    
    // Group transactions by selected period
    const periodMapping = {
      week: 'day',
      month: 'week',
      quarter: 'month',
      year: 'month'
    };
    
    // Grouping logic for the card summary, not the chart
    const groupedTransactions = this.groupTransactionsByPeriod(
      transactions, 
      periodMapping[selectedPeriod as keyof typeof periodMapping] as 'day' | 'week' | 'month' | 'year'
    );
    
    // Convert to array for analysis
    const sortedKeys = Array.from(groupedTransactions.keys()).sort();
    
    const chartData = sortedKeys.map(key => {
      const periodTransactions = groupedTransactions.get(key) || [];
      const total = periodTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      
      return {
        period: key,
        amount: total
      };
    });
    
    // Calculate trend
    let trend = 0;
    if (chartData.length >= 2) {
      const currentAmount = chartData[chartData.length - 1].amount;
      const previousAmount = chartData[chartData.length - 2].amount;
      
      if (previousAmount === 0) {
        trend = 100; // If previous period was 0, show 100% increase
      } else {
        trend = ((currentAmount - previousAmount) / previousAmount) * 100;
      }
    }
    
    // Calculate average
    const average = chartData.length > 0
      ? chartData.reduce((sum, item) => sum + item.amount, 0) / chartData.length
      : 0;
    
    return {
      trend,
      average,
      hasSufficientData: chartData.length >= 2
    };
  }
  
  /**
   * Group transactions by a time period
   */
  private groupTransactionsByPeriod(
    transactions: Transaction[],
    groupBy: 'day' | 'week' | 'month' | 'year'
  ): Map<string, Transaction[]> {
    const grouped = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key: string;
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          // Get the start of the week (Sunday)
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay());
          key = startOfWeek.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = `${date.getFullYear()}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      
      grouped.get(key)?.push(transaction);
    });
    
    return grouped;
  }
  
  /**
   * Format trend value for display
   */
  private formatTrendValue(value: number): { text: string; color: string } {
    const formatted = Math.abs(value).toFixed(1);
    // For expenses, negative change is good
    const isPositive = value >= 0;
    
    return {
      text: `${formatted}%`,
      color: isPositive 
        ? 'text-red-600 dark:text-red-400' 
        : 'text-green-600 dark:text-green-400'
    };
  }
  
  /**
   * Handle period selection change
   */
  private handlePeriodChange = (value: string) => {
    this.setState({ selectedPeriod: value as 'week' | 'month' | 'quarter' | 'year' });
  };
  
  /**
   * Override to provide period selector in header
   */
  protected renderHeaderActions(): React.ReactNode {
    return (
      <Select 
        value={this.state.selectedPeriod} 
        onValueChange={this.handlePeriodChange}
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
    );
  }
  
  /**
   * Implement the abstract method to provide card-specific content
   */
  protected renderCardContent(): React.ReactNode {
    const { transactions, currency = 'USD', showAverage = true, showInsights = true } = this.props;
    const { selectedPeriod } = this.state;
    const { trend, average, hasSufficientData } = this.processTrendData();
    
    // Format trend display
    const { text: trendText, color: trendColor } = this.formatTrendValue(trend);
    const TrendIcon = trend >= 0 ? TrendingUpIcon : TrendingDownIcon;
    
    // Check if we have enough data
    if (!hasSufficientData) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="text-center">
              <InfoIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Not enough data to display spending trends</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting the time period or add more transactions</p>
            </div>
          </div>
        </div>
      );
    }
    
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
        
        {/* Embed the SpendingTrendChart component */}
        <SpendingTrendChart 
          transactions={transactions}
          period={selectedPeriod}
          currency={currency}
          showInsights={showInsights}
          colorScheme={{
            barColor: "#8884d8",
            hoverColor: "#7676d6"
          }}
        />
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
  showInsights: boolean = true,
  currency: string = 'USD',
  className: string = ''
) => {
  return (
    <SpendingTrendsCard
      title="Spending Trends"
      icon={TrendingUpIcon}
      transactions={transactions}
      period={period}
      showAverage={showAverage}
      showInsights={showInsights}
      currency={currency}
      className={className}
    />
  );
};

export default SpendingTrendsCard;
