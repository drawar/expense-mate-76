// src/components/dashboard/charts/CategoryPieChart.tsx
import React from 'react';
import AbstractPieChart, { 
  AbstractPieChartProps,
  PieChartDataItem
} from '@/components/dashboard/abstractions/AbstractPieChart';

/**
 * Props specific to CategoryPieChart
 */
interface CategoryPieChartProps extends AbstractPieChartProps {
  // Additional props specific to category charts
  showTrends?: boolean;
}

/**
 * PieChart component specialized for displaying expense categories
 * Extends AbstractPieChart to inherit common pie chart behaviors
 */
class CategoryPieChart extends AbstractPieChart<CategoryPieChartProps> {
  /**
   * Override to provide custom empty state message
   */
  protected renderEmptyState() {
    const { standalone = false } = this.props;
    
    if (standalone) {
      return super.renderEmptyState();
    }
    
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>No category data available</p>
      </div>
    );
  }
  
  /**
   * Override to add trend information to labels when available
   */
  protected renderLabels(processedData: Array<any>) {
    const { showTrends } = this.props;
    
    if (!showTrends) {
      return super.renderLabels(processedData);
    }
    
    return (
      <div className="w-full md:w-1/2 md:pl-4 mt-4 md:mt-0 flex items-center">
        <div className="grid grid-cols-1 gap-2 w-full max-h-[240px] overflow-y-auto pr-2">
          {processedData.map((entry, index) => (
            <div key={`legend-${index}`} className="flex items-center text-xs">
              <div 
                className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate max-w-[120px]" title={entry.name}>
                {entry.name}
              </span>
              <span className="ml-1 font-medium whitespace-nowrap">
                {entry.percentage.toFixed(0)}%
              </span>
              
              {/* Show trend if available */}
              {entry.trend && (
                <span 
                  className={`ml-2 text-xs ${entry.trend > 0 ? 'text-red-500' : 'text-green-500'}`}
                >
                  {entry.trend > 0 ? '+' : ''}{entry.trend.toFixed(1)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  /**
   * Override getTooltipFormatter to add category specific information
   */
  protected override getTooltipFormatter() {
    const { currency = 'SGD', showTrends } = this.props;
    
    return (value: number, name: string, props: any) => {
      const formattedValue = super.getTooltipFormatter()(value);
      
      // If showing trends and there's trend information, add it to the tooltip
      const entry = props.payload;
      if (showTrends && entry && entry.trend !== undefined) {
        const trendText = `${entry.trend > 0 ? '+' : ''}${entry.trend.toFixed(1)}%`;
        return [`${formattedValue} (${trendText})`, name];
      }
      
      return [formattedValue, name];
    };
  }
}

export default CategoryPieChart;
