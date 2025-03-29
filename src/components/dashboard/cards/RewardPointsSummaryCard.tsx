// src/components/dashboard/cards/RewardPointsSummaryCard.tsx
import React from 'react';
import { CoinsIcon } from 'lucide-react';
import AbstractSummaryCard, { 
  SummaryCardProps 
} from '@/components/dashboard/abstractions/AbstractSummaryCard';
import { Transaction } from '@/types';

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
  protected renderCardValue(): React.ReactNode {
    const { totalRewardPoints, valueColor = "text-amber-800 dark:text-amber-300" } = this.props;
    
    return (
      <div className={`text-2xl font-bold truncate ${valueColor}`}>
        {totalRewardPoints.toLocaleString()}
      </div>
    );
  }
  
  /**
   * Override to provide custom description with transaction count
   */
  protected renderCardDescription(): React.ReactNode {
    const { transactions } = this.props;
    
    const rewardTransactions = transactions.filter(tx => (tx.rewardPoints || 0) > 0).length;
    
    return (
      <div className="text-xs text-muted-foreground">
        From {rewardTransactions} transactions
      </div>
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
      title="Reward Points"
      icon={CoinsIcon}
      totalRewardPoints={totalRewardPoints}
      transactions={transactions}
      cardColor="bg-gradient-to-br from-amber-500/10 to-orange-600/10"
      valueColor="text-amber-800 dark:text-amber-300"
      className="rounded-xl border border-border/30 hover:border-border/80 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
      style={{
        animationDelay: `300ms`,
      }}
    />
  );
};

export default RewardPointsSummaryCard;
