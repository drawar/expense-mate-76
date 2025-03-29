// src/components/dashboard/cards/TransactionSummaryCard.tsx
import React from 'react';
import AbstractSummaryCard, { 
  SummaryCardProps 
} from '@/components/dashboard/abstractions/AbstractSummaryCard';
import { Currency } from '@/types';
import { formatCurrency, formatNumber } from '@/utils/formatting';

interface TransactionSummaryCardProps extends SummaryCardProps {
  transactionCount: number;
  averageAmount: number;
  displayCurrency: Currency;
}

/**
 * Summary card component that displays transaction count
 */
class TransactionSummaryCard extends AbstractSummaryCard<TransactionSummaryCardProps> {
  /**
   * Implement the abstract method to provide card value content
   */
  protected getCardValueContent(): React.ReactNode {
    const { transactionCount } = this.props;
    return (
      <span className="overflow-hidden text-ellipsis">
        {formatNumber(transactionCount)}
      </span>
    );
  }
  
  /**
   * Override getDescriptionContent to provide average amount information
   */
  protected getDescriptionContent(): React.ReactNode {
    const { averageAmount, displayCurrency } = this.props;
    
    return (
      <>
        <span className="overflow-hidden text-ellipsis">
          Avg {formatCurrency(averageAmount, displayCurrency)} per transaction
        </span>
      </>
    );
  }
}

/**
 * Factory function to create a TransactionSummaryCard with default props
 */
export const createTransactionSummaryCard = (
  transactionCount: number,
  averageAmount: number,
  displayCurrency: Currency
) => {
  return (
    <TransactionSummaryCard
      cardType="transaction"
      transactionCount={transactionCount}
      averageAmount={averageAmount}
      displayCurrency={displayCurrency}
    />
  );
};

export default TransactionSummaryCard;
