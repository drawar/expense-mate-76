// src/components/dashboard/cards/PaymentMethodCard.tsx
import React, { Component } from 'react';
import { CreditCardIcon } from 'lucide-react';
import AbstractFinancialInsightCard, { 
  FinancialInsightCardProps 
} from '@/components/dashboard/abstractions/AbstractFinancialInsightCard';
import PaymentMethodPieChart from '@/components/dashboard/charts/PaymentMethodPieChart';
import { PieChartDataItem } from '@/components/dashboard/abstractions/AbstractPieChart';

interface PaymentMethodCardProps extends FinancialInsightCardProps {
  paymentMethodData: PieChartDataItem[];
  currency?: string;
  highlightTopMethod?: boolean;
}

/**
 * Card component that displays payment method distribution
 * Extends AbstractFinancialInsightCard to inherit common card behaviors
 * Contains PaymentMethodPieChart which inherits from AbstractPieChart
 */
class PaymentMethodCard extends AbstractFinancialInsightCard<PaymentMethodCardProps> {
  /**
   * Implement the abstract method to provide card-specific content
   */
  protected renderCardContent(): React.ReactNode {
    const { paymentMethodData, currency, highlightTopMethod } = this.props;
    
    return (
      <PaymentMethodPieChart 
        data={paymentMethodData} 
        currency={currency || 'SGD'}
        highlightTopMethod={highlightTopMethod}
        standalone={false}
      />
    );
  }
}

/**
 * Factory function to create a PaymentMethodCard with default props
 */
export const createPaymentMethodCard = (
  paymentMethodData: PieChartDataItem[],
  currency: string = 'SGD',
  className: string = ''
) => {
  return (
    <PaymentMethodCard
      title="Payment Methods"
      icon={CreditCardIcon}
      paymentMethodData={paymentMethodData}
      currency={currency}
      className={className}
    />
  );
};

export default PaymentMethodCard;
