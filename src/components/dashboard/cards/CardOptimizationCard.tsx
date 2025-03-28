// src/components/dashboard/cards/CardOptimizationCard.tsx
import React from 'react';
import { CreditCardIcon, RefreshCwIcon } from 'lucide-react';
import { Transaction, PaymentMethod } from '@/types';
import AbstractFinancialInsightCard, { 
  FinancialInsightCardProps 
} from '@/components/dashboard/abstractions/AbstractFinancialInsightCard';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Button } from '@/components/ui/button';
import { CardOptimizationAnalyzer, CardSuggestion } from '@/utils/CardOptimizationAnalyzer';

interface CardOptimizationCardProps extends FinancialInsightCardProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  currency?: string;
}

/**
 * Card component that analyzes transactions and suggests optimal payment methods
 * Extends AbstractFinancialInsightCard for consistent card behavior
 */
class CardOptimizationCard extends AbstractFinancialInsightCard<CardOptimizationCardProps> {
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
    const { transactions, paymentMethods, currency = 'SGD' } = this.props;
    
    // Analyze card optimizations using the new utility
    const suggestions = CardOptimizationAnalyzer.analyzeCardOptimizations(
      transactions, 
      paymentMethods
    );
    
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
