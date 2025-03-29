// src/components/dashboard/cards/PaymentMethodSummaryCard.tsx
import React from 'react';
import { CreditCardIcon } from 'lucide-react';
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
  protected renderCardValue(): React.ReactNode {
    const { methodName, valueColor = "text-fuchsia-800 dark:text-fuchsia-300" } = this.props;
    
    return (
      <div className={`text-2xl font-bold truncate w-full ${valueColor}`}>
        {methodName || "N/A"}
      </div>
    );
  }
  
  /**
   * Override getDescriptionContent to provide method value information
   */
  protected getDescriptionContent(): React.ReactNode {
    const { methodName, methodValue, displayCurrency } = this.props;
    
    if (!methodName) {
      return "No data";
    }
    
    return (
      <>
        {formatCurrency(methodValue, displayCurrency)} spent
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
      title="Top Payment Method"
      icon={CreditCardIcon}
      methodName={methodName}
      methodValue={methodValue}
      displayCurrency={displayCurrency}
      cardColor="bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10"
      valueColor="text-fuchsia-800 dark:text-fuchsia-300"
      className="rounded-xl border border-border/30 hover:border-border/80 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
      style={{
        animationDelay: `200ms`,
      }}
    />
  );
};

export default PaymentMethodSummaryCard;
