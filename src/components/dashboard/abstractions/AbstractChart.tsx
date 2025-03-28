// src/components/dashboard/abstractions/AbstractChart.tsx
import React, { Component } from 'react';
import { ChartTooltipProps } from '@/components/dashboard/tooltips/ChartTooltip';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Currency } from '@/types';

const DEFAULT_CURRENCY: Currency = 'SGD';
/**
 * Base chart props interface that all chart types will extend
 */
export interface AbstractChartProps {
  currency?: Currency;
  className?: string;
  title?: string;
}

/**
 * Base chart class with common functionality for all chart types
 */
abstract class AbstractChart<P extends AbstractChartProps> extends Component<P> {
  /**
   * Default implementation of custom tooltip rendering
   * Can be overridden by subclasses for specific functionality
   */
  protected renderCustomTooltip({ active, payload, label }: ChartTooltipProps): React.ReactNode {
    const { currency = DEFAULT_CURRENCY } = this.props;
    
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md">
          <p className="font-medium">{label}</p>
          <p className="text-primary">{formatCurrency(payload[0].value, currency)}</p>
        </div>
      );
    }
    return null;
  }
  
  /**
   * Format currency values for tooltips and displays
   */
  protected formatCurrencyValue(value: number): string {
    const { currency = DEFAULT_CURRENCY } = this.props;
    return formatCurrency(value, currency);
  }
  
  /**
   * Create tooltip formatter for use with Recharts Tooltip component
   */
  protected getTooltipFormatter() {
    const { currency = DEFAULT_CURRENCY } = this.props;
    return (value: number, name: string, props?: any) => [
      formatCurrency(value, currency),
      name
    ];
  }
  
  /**
   * Render empty state when no data is available
   */
  protected renderEmptyState(): React.ReactNode {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <p>No data available for this period</p>
      </div>
    );
  }
  
  /**
   * Abstract method to be implemented by specific chart types
   */
  protected abstract renderChart(): React.ReactNode;
  
  /**
   * Common render method for all charts
   */
  render() {
    return this.renderChart();
  }
}

export default AbstractChart;
