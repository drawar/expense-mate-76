// src/components/dashboard/cards/PaymentMethodSummaryCard.tsx
import React from 'react';
import AbstractSummaryCard, { 
  SummaryCardProps 
} from '@/components/dashboard/abstractions/AbstractSummaryCard';
import { Currency } from '@/types';
import { formatCurrency } from '@/utils/formatting';

interface PaymentMethodSummaryCardProps extends SummaryCardProps {
  methodName: string;
  methodValue: number;
  displayCurrency: Currency;
}

/**
 * Summary card component that displays top payment method
 */
class PaymentMethodSummaryCard extends AbstractSummaryCard<PaymentMethodSummaryCardProps> {
  /**
   * Implement the abstract method to provide card value content
   */
  protected getCardValueContent(): React.ReactNode {
    const { methodName } = this.props;
    return (
      <span className="overflow-hidden text-ellipsis">
        {methodName || "N/A"}
      </span>
    );
  }
  
  /**
   * Override getDescriptionContent to provide method value information
   */
  protected getDescriptionContent(): React.ReactNode {
    const { methodName, methodValue, displayCurrency } = this.props;
    
    if (!methodName) {
      return <span className="overflow-hidden text-ellipsis">No data</span>;
    }
    
    return (
      <>
        <span className="overflow-hidden text-ellipsis">
          {formatCurrency(methodValue, displayCurrency)} spent
        </span>
      </>
    );
  }
}

/**
 * Factory function to create a PaymentMethodSummaryCard with default props
 */
export const createPaymentMethodSummaryCard = (
  methodName: string,
  methodValue: number,
  displayCurrency: Currency
) => {
  return (
    <PaymentMethodSummaryCard
      cardType="paymentMethod"
      methodName={methodName}
      methodValue={methodValue}
      displayCurrency={displayCurrency}
    />
  );
};

export default PaymentMethodSummaryCard;
