// src/components/dashboard/cards/ExpenseSummaryCard.tsx
import React from 'react';
import { BarChartIcon, TrendingUp, TrendingDown } from 'lucide-react';
import AbstractSummaryCard, { 
  SummaryCardProps 
} from '@/components/dashboard/abstractions/AbstractSummaryCard';
import { Currency } from '@/types';

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
      <div className={`text-2xl font-bold truncate ${valueColor}`}>
        {`${displayCurrency} ${totalExpenses.toLocaleString()}`}
      </div>
    );
  }
  
  /**
   * Helper function to render percentage change with icon and color
   */
  protected renderPercentChange() {
    const { percentageChange } = this.props;
    const isPositive = percentageChange >= 0;
    const color = isPositive ? "text-red-500 dark:text-red-400" : "text-green-500 dark:text-green-400";
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{`${isPositive ? '+' : ''}${percentageChange}% since last period`}</span>
      </div>
    );
  }
  
  /**
   * Override to provide custom description with trend information
   */
  protected renderCardDescription(): React.ReactNode {
    return this.renderPercentChange();
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
