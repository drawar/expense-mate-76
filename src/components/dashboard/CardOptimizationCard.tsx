// src/components/dashboard/cards/CardOptimizationCard.tsx
import React from 'react';
import { CreditCardIcon, RefreshCwIcon } from 'lucide-react';
import { Transaction, PaymentMethod } from '@/types';
import AbstractFinancialInsightCard, { 
  FinancialInsightCardProps 
} from '@/components/dashboard/abstractions/AbstractFinancialInsightCard';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Button } from '@/components/ui/button';

interface CardOptimizationCardProps extends FinancialInsightCardProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  currency?: string;
}

/**
 * Interface defining optimal card suggestions
 */
interface CardSuggestion {
  category: string;
  currentMethod: string;
  suggestedMethod: string;
  potentialSavings: number;
  transactionCount: number;
}

/**
 * Card component that analyzes transactions and suggests optimal payment methods
 * Extends AbstractFinancialInsightCard for consistent card behavior
 */
class CardOptimizationCard extends AbstractFinancialInsightCard<CardOptimizationCardProps> {
  /**
   * Analyze transactions and payment methods to find optimization opportunities
   */
  private analyzeCardOptimizations(): CardSuggestion[] {
    const { transactions, paymentMethods } = this.props;
    
    // Group transactions by category
    const categoryGroups = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(transaction);
    });
    
    // Find the most used payment method for each category
    const categoryPaymentMethods = new Map<string, Map<string, number>>();
    
    categoryGroups.forEach((transactions, category) => {
      const methodCounts = new Map<string, number>();
      
      transactions.forEach(transaction => {
        const method = transaction.paymentMethod || 'Unknown';
        methodCounts.set(method, (methodCounts.get(method) || 0) + transaction.amount);
      });
      
      categoryPaymentMethods.set(category, methodCounts);
    });
    
    // Create a map of category rewards by payment method
    const paymentMethodRewards = new Map<string, Map<string, number>>();
    
    paymentMethods.forEach(method => {
      const rewardsMap = new Map<string, number>();
      
      // Extract category rewards from payment method data
      if (method.categoryRewards) {
        Object.entries(method.categoryRewards).forEach(([category, rate]) => {
          rewardsMap.set(category, rate);
        });
      }
      
      paymentMethodRewards.set(method.id, rewardsMap);
    });
    
    // Find optimization opportunities
    const suggestions: CardSuggestion[] = [];
    
    categoryGroups.forEach((transactions, category) => {
      // Skip if no transactions
      if (transactions.length === 0) return;
      
      // Get the current most used payment method
      const methodsUsed = categoryPaymentMethods.get(category) || new Map();
      if (methodsUsed.size === 0) return;
      
      // Find the most used method
      let currentMethod = '';
      let maxUsage = 0;
      
      methodsUsed.forEach((amount, method) => {
        if (amount > maxUsage) {
          maxUsage = amount;
          currentMethod = method;
        }
      });
      
      // Find payment method with best rewards for this category
      let bestMethod = '';
      let bestRewardRate = 0;
      
      paymentMethodRewards.forEach((rewardsMap, methodId) => {
        const rate = rewardsMap.get(category) || 0;
        if (rate > bestRewardRate) {
          bestRewardRate = rate;
          bestMethod = methodId;
        }
      });
      
      // If there's a better method, add suggestion
      if (bestMethod && bestMethod !== currentMethod && bestRewardRate > 0) {
        // Get current method reward rate
        const currentMethodRewards = paymentMethodRewards.get(currentMethod) || new Map();
        const currentRewardRate = currentMethodRewards.get(category) || 0;
        
        // Calculate potential savings
        const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
        const currentRewards = totalSpent * (currentRewardRate / 100);
        const potentialRewards = totalSpent * (bestRewardRate / 100);
        const potentialSavings = potentialRewards - currentRewards;
        
        if (potentialSavings > 0) {
          // Find payment method names
          const currentMethodName = paymentMethods.find(m => m.id === currentMethod)?.name || currentMethod;
          const suggestedMethodName = paymentMethods.find(m => m.id === bestMethod)?.name || bestMethod;
          
          suggestions.push({
            category,
            currentMethod: currentMethodName,
            suggestedMethod: suggestedMethodName,
            potentialSavings,
            transactionCount: transactions.length
          });
        }
      }
    });
    
    // Sort suggestions by potential savings
    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings).slice(0, 3);
  }
  
  /**
   * Render header actions for the card
   */
  protected renderHeaderActions(): React.ReactNode {
    return (
      <Button variant="ghost" size="sm" className="h-8 px-2">
        <RefreshCwIcon className="h-4 w-4 mr-1" />
        <span className="text-xs">Refresh</span>
      </Button>
    );
  }
  
  /**
   * Implement the abstract method to provide card-specific content
   */
  protected renderCardContent(): React.ReactNode {
    const { currency = 'SGD' } = this.props;
    const suggestions = this.analyzeCardOptimizations();
    
    if (suggestions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <CreditCardIcon className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No card optimization suggestions available.</p>
          <p className="text-xs text-muted-foreground mt-1">You're already using optimal payment methods!</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Potential annual savings with optimal cards:
          </p>
          <p className="font-medium text-green-500">
            +{formatCurrency(
              suggestions.reduce((sum, suggestion) => sum + suggestion.potentialSavings, 0) * 12,
              currency
            )}
          </p>
        </div>
        
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{suggestion.category}</span>
                <span className="text-green-500 text-xs">
                  +{formatCurrency(suggestion.potentialSavings, currency)}/mo
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {suggestion.transactionCount} transactions
              </p>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Current</p>
                  <p className="text-xs font-medium truncate">{suggestion.currentMethod}</p>
                </div>
                <div className="mx-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Suggested</p>
                  <p className="text-xs font-medium text-primary truncate">{suggestion.suggestedMethod}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

/**
 * Factory function to create a CardOptimizationCard with default props
 */
export const createCardOptimizationCard = (
  transactions: Transaction[],
  paymentMethods: PaymentMethod[],
  currency: string = 'SGD',
  className: string = ''
) => {
  return (
    <CardOptimizationCard
      title="Card Optimization"
      icon={CreditCardIcon}
      transactions={transactions}
      paymentMethods={paymentMethods}
      currency={currency}
      className={className}
    />
  );
};

export default CardOptimizationCard;
