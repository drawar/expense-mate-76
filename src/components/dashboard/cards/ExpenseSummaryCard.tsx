// src/components/dashboard/cards/ExpenseSummaryCard.tsx
import React from 'react';
import { BarChartIcon, TrendingUp, TrendingDown } from 'lucide-react';
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
  protected renderCardValue(): React.ReactNode {
    const { totalExpenses, displayCurrency, valueColor = "text-violet-800 dark:text-violet-300" } = this.props;
    
    return (
      <div className={`text-2xl font-bold truncate w-full ${valueColor}`}>
        {formatCurrency(totalExpenses, displayCurrency)}
      </div>
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
        <Icon className={`h-3.5 w-3.5 ${trendColor}`} />
        <span className={trendColor}>
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
      title="Total Expenses"
      icon={BarChartIcon}
      totalExpenses={totalExpenses}
      percentageChange={percentageChange}
      displayCurrency={displayCurrency}
      cardColor="bg-gradient-to-br from-violet-500/10 to-purple-600/10"
      valueColor="text-violet-800 dark:text-violet-300"
      className="rounded-xl border border-border/30 hover:border-border/80 hover:shadow-lg transition-all duration-200 hover:scale-[1.01]"
      style={{
        animationDelay: `0ms`,
      }}
    />
  );
};

export default ExpenseSummaryCard;
