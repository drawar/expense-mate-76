// src/components/dashboard/cards/CardOptimizationCard.tsx
import React, { useMemo } from 'react';
import { CreditCardIcon, RefreshCwIcon, ArrowRightIcon } from 'lucide-react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatting';
import { Button } from '@/components/ui/button';

interface CardSuggestion {
  category: string;
  transactionCount: number;
  currentMethod: string;
  suggestedMethod: string;
  potentialSavings: number;
}

interface CardOptimizationCardProps {
  title: string;
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  currency?: Currency;
  className?: string;
}

/**
 * Card component that analyzes transactions and suggests optimal payment methods
 */
const CardOptimizationCard: React.FC<CardOptimizationCardProps> = ({
  title,
  transactions,
  paymentMethods,
  currency = 'SGD',
  className = ''
}) => {
  // Analyze card optimizations using memoization
  const suggestions = useMemo<CardSuggestion[]>(() => {
    // Skip processing if there's insufficient data
    if (transactions.length === 0 || paymentMethods.length < 2) {
      return [];
    }

    // Group transactions by category to analyze spending patterns
    const categoryTransactions = new Map<string, Transaction[]>();
    
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      if (!categoryTransactions.has(category)) {
        categoryTransactions.set(category, []);
      }
      categoryTransactions.get(category)!.push(tx);
    });
    
    const results: CardSuggestion[] = [];
    
    // Analyze each category to find optimization opportunities
    categoryTransactions.forEach((categoryTxs, category) => {
      // Skip categories with too few transactions
      if (categoryTxs.length < 3) return;
      
      // Group by current payment method to find the predominant one
      const methodCount = new Map<string, number>();
      const methodAmount = new Map<string, number>();
      
      categoryTxs.forEach(tx => {
        const methodName = tx.paymentMethod?.name || 'Unknown';
        methodCount.set(methodName, (methodCount.get(methodName) || 0) + 1);
        methodAmount.set(methodName, (methodAmount.get(methodName) || 0) + tx.amount);
      });
      
      // Find the most commonly used payment method
      const entries = Array.from(methodCount.entries());
      if (entries.length === 0) return;
      
      entries.sort((a, b) => b[1] - a[1]);
      const currentMethod = entries[0][0];
      
      // Find the best rewards card for this category
      let bestMethod = currentMethod;
      let bestReward = 0;
      
      paymentMethods.forEach(method => {
        if (!method.active) return;
        
        // Calculate potential reward points based on method's rules
        let potentialReward = 0;
        
        method.rewardRules.forEach(rule => {
          if (rule.type === 'mcc' || rule.type === 'category') {
            // Check if this rule applies to the current category
            const conditions = Array.isArray(rule.condition) 
              ? rule.condition 
              : [rule.condition];
              
            if (conditions.some(cond => category.toLowerCase().includes(cond.toLowerCase()))) {
              potentialReward = Math.max(potentialReward, rule.pointsMultiplier);
            }
          }
        });
        
        if (potentialReward > bestReward) {
          bestReward = potentialReward;
          bestMethod = method.name;
        }
      });
      
      // If we found a better method, add it to suggestions
      if (bestMethod !== currentMethod) {
        const totalAmount = methodAmount.get(currentMethod) || 0;
        const currentReward = 1; // Assume standard 1x points for current method
        const potentialSavings = totalAmount * (bestReward - currentReward) / 100;
        
        if (potentialSavings > 0) {
          results.push({
            category,
            transactionCount: methodCount.get(currentMethod) || 0,
            currentMethod,
            suggestedMethod: bestMethod,
            potentialSavings
          });
        }
      }
    });
    
    // Sort by potential savings (highest first)
    return results.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }, [transactions, paymentMethods]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <RefreshCwIcon className="h-4 w-4 mr-1" />
            <span className="text-xs">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <CreditCardIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No card optimization suggestions available.</p>
            <p className="text-xs text-muted-foreground mt-1">You're already using optimal payment methods!</p>
          </div>
        ) : (
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
                      <ArrowRightIcon size={16} />
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
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(CardOptimizationCard);
