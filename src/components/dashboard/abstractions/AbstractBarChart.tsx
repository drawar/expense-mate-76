// src/components/dashboard/abstractions/AbstractBarChart.tsx
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Transaction } from '@/types';
import AbstractChart, { AbstractChartProps } from '@/components/dashboard/abstractions/AbstractChart';
import { ChartTooltip, ChartTooltipProps } from '@/components/dashboard/tooltips/ChartTooltip';

/**
 * Base props interface for bar chart components
 */
export interface BarChartProps extends AbstractChartProps {
  transactions: Transaction[];
  period?: 'day' | 'week' | 'month' | 'quarter';
  colorScheme?: {
    barColor: string;
    hoverColor: string;
  };
}

/**
 * Abstract base class for bar chart visualizations
 * Provides consistent styling and data processing while allowing
 * subclasses to define their specific data transformations
 */
abstract class AbstractBarChart<P extends BarChartProps> extends AbstractChart<P> {
  /**
   * Group transactions by a time period (day, week, month, year)
   */
  protected groupTransactionsByPeriod(
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
   * Calculate percentage change between two values
   */
  protected calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }
  
  /**
   * Format a trend value for display with appropriate styling
   */
  protected formatTrendValue(value: number): { text: string; color: string } {
    const formatted = Math.abs(value).toFixed(1);
    // For expenses, trend interpretations are reversed (negative is good)
    const isPositiveTrend = value < 0;
    
    return {
      text: `${formatted}%`,
      color: isPositiveTrend 
        ? 'text-green-600 dark:text-green-400' 
        : 'text-red-600 dark:text-red-400'
    };
  }
  
  /**
   * Process the transaction data into a format suitable for the bar chart
   * Must be implemented by subclasses
   */
  protected abstract processChartData(): {
    chartData: Array<{ period: string; amount: number; originalKey: string }>;
    trend: number;
  };
  
  /**
   * Render the bar chart with the processed data
   */
  protected renderChart(): React.ReactNode {
    const { currency = 'USD', colorScheme = { barColor: '#8884d8', hoverColor: '#7171d6' } } = this.props;
    const { chartData } = this.processChartData();
    
    // Check if we have enough data
    if (chartData.length === 0) {
      return this.renderEmptyState();
    }
    
    return (
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
            <Tooltip 
              content={(props) => this.renderCustomTooltip(props as ChartTooltipProps)}
            />
            <Bar 
              dataKey="amount" 
              fill={colorScheme.barColor}
              activeBar={{ fill: colorScheme.hoverColor }}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
}

export default AbstractBarChart;
