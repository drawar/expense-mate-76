
// src/components/dashboard/cards/SavingsPotentialCard.tsx
import React from 'react';
import { PiggyBankIcon, TrendingDownIcon, BarChart3Icon } from 'lucide-react';
import { Transaction, Currency } from '@/types';
import AbstractFinancialInsightCard, { 
  FinancialInsightCardProps 
} from '@/components/dashboard/abstractions/AbstractFinancialInsightCard';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Progress } from '@/components/ui/progress';

interface SavingsPotentialCardProps extends FinancialInsightCardProps {
  transactions: Transaction[];
  savingsGoalPercentage?: number;
  currency?: Currency;
}

/**
 * Interface for category spending data
 */
interface CategorySpending {
  category: string;
  amount: number;
  discretionary: boolean;
  savingsPotential: number;
}

/**
 * Card component that analyzes transactions to identify savings potential
 * Extends AbstractFinancialInsightCard for consistent card behavior
 */
class SavingsPotentialCard extends AbstractFinancialInsightCard<SavingsPotentialCardProps> {
  /**
   * Define discretionary spending categories
   * These are categories where spending can potentially be reduced
   */
  private discretionaryCategories = [
    'Entertainment',
    'Dining',
    'Shopping',
    'Leisure',
    'Subscriptions',
    'Travel',
    'Hobbies',
    'Gifts',
    'Alcohol',
    'Coffee',
    'Electronics',
    'Clothing',
    'Beauty',
    'Fast Food'
  ];
  
  /**
   * Analyze transactions to identify savings potential
   */
  private analyzeSavingsPotential(): {
    totalSpending: number;
    discretionarySpending: number;
    savingsTarget: number;
    savingsPotential: number;
    topDiscretionaryCategories: CategorySpending[];
    savingsProgress: number;
  } {
    const { transactions, savingsGoalPercentage = 20 } = this.props;
    
    // Calculate total spending
    const totalSpending = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Group spending by category
    const categorySpending = new Map<string, number>();
    
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      categorySpending.set(
        category, 
        (categorySpending.get(category) || 0) + tx.amount
      );
    });
    
    // Identify discretionary and essential spending
    let discretionarySpending = 0;
    const categoryData: CategorySpending[] = [];
    
    categorySpending.forEach((amount, category) => {
      const isDiscretionary = this.discretionaryCategories.includes(category);
      
      // Calculate potential savings for this category
      // For discretionary categories, estimate 30% potential savings
      // For essential categories, estimate 5% potential savings
      const savingsPotential = isDiscretionary ? amount * 0.3 : amount * 0.05;
      
      if (isDiscretionary) {
        discretionarySpending += amount;
      }
      
      categoryData.push({
        category,
        amount,
        discretionary: isDiscretionary,
        savingsPotential
      });
    });
    
    // Sort categories by savings potential
    const topDiscretionaryCategories = categoryData
      .filter(cat => cat.discretionary)
      .sort((a, b) => b.savingsPotential - a.savingsPotential)
      .slice(0, 3);
    
    // Calculate savings target and potential
    const savingsTarget = totalSpending * (savingsGoalPercentage / 100);
    const savingsPotential = categoryData.reduce(
      (sum, cat) => sum + cat.savingsPotential, 
      0
    );
    
    // Calculate savings progress
    const savingsProgress = Math.min(
      100, 
      savingsPotential > 0 ? (savingsPotential / savingsTarget) * 100 : 0
    );
    
    return {
      totalSpending,
      discretionarySpending,
      savingsTarget,
      savingsPotential,
      topDiscretionaryCategories,
      savingsProgress
    };
  }
  
  /**
   * Implement the abstract method to provide card-specific content
   */
  protected renderCardContent(): React.ReactNode {
    const { currency = 'SGD' as Currency } = this.props;
    const analysis = this.analyzeSavingsPotential();
    
    if (this.props.transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <PiggyBankIcon className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No transaction data available.</p>
          <p className="text-xs text-muted-foreground mt-1">Add transactions to see savings potential.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Monthly Savings Potential
          </p>
          <p className="font-medium text-green-500">
            {formatCurrency(analysis.savingsPotential, currency)}
          </p>
        </div>
        
        {/* Savings Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Progress towards goal</span>
            <span>{Math.round(analysis.savingsProgress)}%</span>
          </div>
          <Progress value={analysis.savingsProgress} className="h-2" />
        </div>
        
        {/* Discretionary Spending Summary */}
        <div className="p-3 rounded-lg border border-border bg-muted/30">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm flex items-center">
              <BarChart3Icon className="h-4 w-4 mr-1" /> 
              Discretionary Spending
            </span>
            <span className="text-sm font-medium">
              {formatCurrency(analysis.discretionarySpending, currency)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round((analysis.discretionarySpending / analysis.totalSpending) * 100)}% of your total spending
          </p>
        </div>
        
        {/* Top Savings Categories */}
        <div className="space-y-2">
          <p className="text-xs font-medium">Top savings opportunities:</p>
          
          {analysis.topDiscretionaryCategories.map((category, index) => (
            <div key={index} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <div className="flex items-center">
                <TrendingDownIcon className="h-3.5 w-3.5 text-green-500 mr-2" />
                <span className="text-xs">{category.category}</span>
              </div>
              <span className="text-xs text-green-500">
                -{formatCurrency(category.savingsPotential, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

/**
 * Factory function to create a SavingsPotentialCard with default props
 */
export const createSavingsPotentialCard = (
  transactions: Transaction[],
  savingsGoalPercentage: number = 20,
  currency: string = 'SGD',
  className: string = ''
) => {
  return (
    <SavingsPotentialCard
      title="Savings Potential"
      icon={PiggyBankIcon}
      transactions={transactions}
      savingsGoalPercentage={savingsGoalPercentage}
      currency={currency as Currency}
      className={className}
    />
  );
};

export default SavingsPotentialCard;
