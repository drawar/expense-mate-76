// src/components/dashboard/cards/ExpenseSummaryCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AbstractSummaryCard, { 
  SummaryCardProps 
} from '@/components/dashboard/abstractions/AbstractSummaryCard';
import { Currency } from '@/types';
import { formatCurrency, formatPercentage, getExpenseTrendColor, isExpenseChangePositive } from '@/utils/formatting';

interface ExpenseSummaryCardProps extends SummaryCardProps {
  totalExpenses: number;
  percentageChange: number;
  displayCurrency: Currency;
}

/**
 * Summary card component that displays total expenses
 */
class ExpenseSummaryCard extends AbstractSummaryCard<ExpenseSummaryCardProps> {
  /**
   * Implement the abstract method to provide card value content
   */
  protected getCardValueContent(): React.ReactNode {
    const { totalExpenses, displayCurrency } = this.props;
    return (
      <span className="overflow-hidden text-ellipsis">
        {formatCurrency(totalExpenses, displayCurrency)}
      </span>
    );
  }
  
  /**
   * Override getDescriptionContent to provide percentage change with trend icon
   * This keeps the content separate from the styling, which is handled by renderCardDescription
   */
  protected getDescriptionContent(): React.ReactNode {
    const { percentageChange } = this.props;
    const isPositive = isExpenseChangePositive(percentageChange);
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const trendColor = getExpenseTrendColor(percentageChange);
    
    return (
      <>
        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${trendColor}`} />
        <span className={`${trendColor} overflow-hidden text-ellipsis`}>
          {formatPercentage(percentageChange, isPositive)} since last period
        </span>
      </>
    );
  }
}

/**
 * Factory function to create an ExpenseSummaryCard with default props
 */
export const createExpenseSummaryCard = (
  totalExpenses: number,
  percentageChange: number,
  displayCurrency: Currency
) => {
  return (
    <ExpenseSummaryCard
      cardType="expense"
      totalExpenses={totalExpenses}
      percentageChange={percentageChange}
      displayCurrency={displayCurrency}
    />
  );
};

export default ExpenseSummaryCard;
