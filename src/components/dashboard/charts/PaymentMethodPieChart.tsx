// src/components/dashboard/charts/PaymentMethodPieChart.tsx
import React from 'react';
import AbstractPieChart, { 
  AbstractPieChartProps,
  PieChartDataItem
} from '@/components/dashboard/abstractions/AbstractPieChart';

/**
 * Props specific to PaymentMethodPieChart
 */
interface PaymentMethodPieChartProps extends AbstractPieChartProps {
  // Additional props specific to payment method charts
  highlightTopMethod?: boolean;
}

/**
 * PieChart component specialized for displaying payment methods
 * Extends AbstractPieChart to inherit common pie chart behaviors
 */
class PaymentMethodPieChart extends AbstractPieChart<PaymentMethodPieChartProps> {
  /**
   * Override to provide custom empty state message
   */
  protected renderEmptyState() {
    const { title = 'Payment Methods', standalone = false } = this.props;
    
    if (standalone) {
      return super.renderEmptyState();
    }
    
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>No payment method data available</p>
      </div>
    );
  }
  
  /**
   * Override getTooltipFormatter to add payment method specific information
   */
  protected override getTooltipFormatter() {
    const { currency = 'SGD' } = this.props;
    
    return (value: number, name: string, props?: any) => {
      const formattedValue = super.getTooltipFormatter()(value, name)[0];
      
      // If there's reward rate information, add it to the tooltip
      if (props?.payload) {
        const entry = props.payload;
        const { rewardsRate } = entry;
        
        if (rewardsRate !== undefined) {
          return [`${formattedValue} (${rewardsRate}% rewards)`, name];
        }
      }
      
      return [formattedValue, name];
    };
  }
}

export default PaymentMethodPieChart;
