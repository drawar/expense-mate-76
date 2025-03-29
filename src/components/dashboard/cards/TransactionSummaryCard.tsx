// src/components/dashboard/cards/TransactionSummaryCard.tsx
import React from 'react';
import { ReceiptIcon } from 'lucide-react';
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
  protected renderCardValue(): React.ReactNode {
    const { transactionCount, valueColor = "text-blue-800 dark:text-blue-300" } = this.props;
    
    return (
      <div className={`text-2xl font-bold truncate w-full ${valueColor}`}>
        {formatNumber(transactionCount)}
      </div>
    );
  }
  
  /**
   * Override getDescriptionContent to provide average amount information
   */
  protected getDescriptionContent(): React.ReactNode {
    const { averageAmount, displayCurrency } = this.props;
    
    return (
      <>
        Avg {formatCurrency(averageAmount, displayCurrency)} per transaction
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
      title="Transactions"
      icon={ReceiptIcon}
      transactionCount={transactionCount}
      averageAmount={averageAmount}
      displayCurrency={displayCurrency}
      cardColor="bg-gradient-to-br from-blue-500/10 to-indigo-600/10"
      valueColor="text-blue-800 dark:text-blue-300"
      className="rounded-xl border border-border/30 hover:border-border/80 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
      style={{
        animationDelay: `100ms`,
      }}
    />
  );
};

export default TransactionSummaryCard;
