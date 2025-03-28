// src/components/dashboard/abstractions/AbstractPieChart.tsx
import React, { Component } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/currencyFormatter';

/**
 * Common data structure for pie chart data
 */
export interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
}

/**
 * Base props interface for pie charts
 */
export interface AbstractPieChartProps {
  data: PieChartDataItem[];
  title?: string;
  currency?: string;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  className?: string;
  // Flag to determine if this chart is being used standalone or inside another component
  standalone?: boolean;
}

/**
 * Abstract base class for pie charts
 * Provides common functionality for different types of pie charts
 */
abstract class AbstractPieChart<P extends AbstractPieChartProps> extends Component<P> {
  /**
   * Process the data to add percentage calculations
   * Pre-calculating percentages improves performance
   */
  protected processData(): Array<PieChartDataItem & { percentage: number }> {
    const { data } = this.props;
    
    if (!data || data.length === 0) return [];
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    return data.map(item => ({
      ...item,
      percentage: total > 0 ? (item.value / total * 100) : 0
    }));
  }
  
  /**
   * Create tooltip formatter for currency values
   */
  protected getTooltipFormatter() {
    const { currency = 'USD' } = this.props;
    return (value: number) => formatCurrency(value, currency);
  }
  
  /**
   * Custom label formatter for tooltips
   * Can be overridden by subclasses
   */
  protected getLabelFormatter() {
    return (name: string) => name;
  }
  
  /**
   * Render empty state when no data is available
   */
  protected renderEmptyState() {
    const { title = 'Chart', standalone = true } = this.props;
    
    if (standalone) {
      return (
        <Card className="chart-container h-full flex flex-col rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
          <CardHeader className="pb-0 pt-4">
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow py-4">
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      );
    }
  }
  
  /**
   * Render the labels/legend for the pie chart
   */
  protected renderLabels(processedData: Array<PieChartDataItem & { percentage: number }>) {
    return (
      <div className="w-full md:w-1/2 md:pl-4 mt-4 md:mt-0 flex items-center">
        <div className="grid grid-cols-1 gap-2 w-full max-h-[240px] overflow-y-auto pr-2">
          {processedData.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate max-w-[180px]" title={entry.name}>
                {entry.name}
              </span>
              <span className="ml-1 font-medium whitespace-nowrap">
                {entry.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  /**
   * Render pie chart content with data
   */
  protected renderPieChartContent() {
    const { 
      innerRadius = 40, 
      outerRadius = 80, 
      paddingAngle = 2 
    } = this.props;
    
    // Process data to add percentages
    const processedData = this.processData();
    
    if (processedData.length === 0) {
      return this.renderEmptyState();
    }
    
    // Get tooltip formatter
    const tooltipFormatter = this.getTooltipFormatter();
    const labelFormatter = this.getLabelFormatter();
    
    return (
      <div className="flex flex-col md:flex-row h-full">
        {/* Chart on the left with memoized rendering */}
        <div className="w-full md:w-1/2 min-h-[240px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                outerRadius={outerRadius}
                innerRadius={innerRadius}
                paddingAngle={paddingAngle}
                dataKey="value"
                labelLine={false}
                // Disable labels for better performance
                isAnimationActive={false}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={tooltipFormatter}
                labelFormatter={labelFormatter}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: '8px 12px',
                  backgroundColor: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Labels with pre-calculated percentages */}
        {this.renderLabels(processedData)}
      </div>
    );
  }
  
  /**
   * Render full pie chart card with header and content
   */
  render() {
    const { title = 'Chart', className = '', standalone = true } = this.props;
    const processedData = this.processData();
    
    if (processedData.length === 0) {
      return this.renderEmptyState();
    }
    
    // If this chart is being used inside another component (like a card),
    // only render the chart content
    if (!standalone) {
      return this.renderPieChartContent();
    }
    
    // Otherwise, render the complete card with the chart inside
    return (
      <Card className={`chart-container h-full flex flex-col rounded-xl border border-border/50 bg-card hover:shadow-md transition-all ${className}`}>
        <CardHeader className="pb-0 pt-4">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow py-4">
          {this.renderPieChartContent()}
        </CardContent>
      </Card>
    );
  }
}

/**
 * Create a concrete implementation that can be used as a direct replacement
 * for PieChartCard.tsx
 */
export class PieChartCard extends AbstractPieChart<AbstractPieChartProps> {
  // This class inherits all functionality from AbstractPieChart
  // and can be used as a direct replacement for the original PieChartCard
}

export default AbstractPieChart;
