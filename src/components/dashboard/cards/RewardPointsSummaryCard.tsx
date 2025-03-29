// src/components/dashboard/cards/RewardPointsSummaryCard.tsx
import React from 'react';
import AbstractSummaryCard, { 
  SummaryCardProps 
} from '@/components/dashboard/abstractions/AbstractSummaryCard';
import { Transaction } from '@/types';
import { formatNumber } from '@/utils/formatting';

interface RewardPointsSummaryCardProps extends SummaryCardProps {
  totalRewardPoints: number;
  transactions: Transaction[];
}

/**
 * Summary card component that displays reward points
 */
class RewardPointsSummaryCard extends AbstractSummaryCard<RewardPointsSummaryCardProps> {
  /**
   * Implement the abstract method to provide card value content
   */
  protected getCardValueContent(): React.ReactNode {
    const { totalRewardPoints } = this.props;
    return (
      <span className="overflow-hidden text-ellipsis">
        {formatNumber(totalRewardPoints)}
      </span>
    );
  }
  
  /**
   * Calculate number of transactions with rewards
   */
  private getRewardTransactionsCount(): number {
    const { transactions } = this.props;
    return transactions.filter(tx => (tx.rewardPoints || 0) > 0).length;
  }
  
  /**
   * Override getDescriptionContent to provide transaction count information
   */
  protected getDescriptionContent(): React.ReactNode {
    const rewardTransactions = this.getRewardTransactionsCount();
    
    return (
      <>
        <span className="overflow-hidden text-ellipsis">
          From {formatNumber(rewardTransactions)} transactions
        </span>
      </>
    );
  }
}

/**
 * Factory function to create a RewardPointsSummaryCard with default props
 */
export const createRewardPointsSummaryCard = (
  totalRewardPoints: number,
  transactions: Transaction[]
) => {
  return (
    <RewardPointsSummaryCard
      cardType="rewardPoints"
      totalRewardPoints={totalRewardPoints}
      transactions={transactions}
    />
  );
};

export default RewardPointsSummaryCard;
