// src/hooks/useChartData.ts
import { useMemo } from 'react';
import { Transaction, Currency, PaymentMethod } from '@/types';
import { processPieChartData } from '@/utils/chartDataProcessor';
import { CHART_COLORS } from '@/utils/dashboardCalculations';

/**
 * Hook for generating pie chart data from transactions
 */
export function usePieChartData(
  transactions: Transaction[],
  groupByField: 'paymentMethod' | 'category' | string,
  displayCurrency: Currency
) {
  return useMemo(() => {
    return processPieChartData(
      transactions,
      groupByField,
      displayCurrency,
      CHART_COLORS
    );
  }, [transactions, groupByField, displayCurrency]);
}

/**
 * Hook for generating spending trend data
 */
export function useSpendingTrendData(
  transactions: Transaction[],
  period: 'week' | 'month' | 'quarter' | 'year' = 'month'
) {
  return useMemo(() => {
    // This call will be implemented in the future
    // when the processTransactionsForChart utility is ready
    const result = {
      chartData: [],
      trend: 0,
      average: 0,
      topCategories: []
    };
    
    // This is only placeholder data for now
    return {
      chartData: [],
      trend: 0,
      average: 0,
      topCategories: []
    };
  }, [transactions, period]);
}

/**
 * Interface for card optimization suggestions
 */
export interface CardSuggestion {
  category: string;
  transactionCount: number;
  currentMethod: string;
  suggestedMethod: string;
  potentialSavings: number;
}

/**
 * Hook for generating payment method optimization data
 * Returns suggested better payment methods for different categories
 */
export function usePaymentMethodOptimization(
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): CardSuggestion[] {
  return useMemo(() => {
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
          // Check for merchant/MCC based rules - these can apply to categories
          if (rule.type === 'mcc' || rule.type === 'merchant') {
            // Check if this rule applies to the current category
            const conditions = Array.isArray(rule.condition) 
              ? rule.condition 
              : [rule.condition];
              
            // Use lowercase contains match to be more flexible
            if (conditions.some(cond => {
              const categoryLower = category.toLowerCase();
              const condLower = typeof cond === 'string' ? cond.toLowerCase() : '';
              return categoryLower.includes(condLower) || condLower.includes(categoryLower);
            })) {
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
}

/**
 * Interface for category savings potential
 */
export interface CategorySavingsPotential {
  category: string;
  amount: number;
  savingsPotential: number;
  discretionary: boolean;
}

/**
 * Hook for generating savings potential data
 */
export function useSavingsPotential(
  transactions: Transaction[],
  savingsGoalPercentage: number = 20
) {
  return useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        totalSpending: 0,
        discretionarySpending: 0,
        savingsTarget: 0,
        savingsPotential: 0,
        topDiscretionaryCategories: [],
        savingsProgress: 0
      };
    }
    
    // Define discretionary spending categories
    const discretionaryCategories = [
      'Entertainment', 'Dining', 'Shopping', 'Leisure',
      'Subscriptions', 'Travel', 'Hobbies', 'Gifts',
      'Alcohol', 'Coffee', 'Electronics', 'Clothing',
      'Beauty', 'Fast Food', 'Food & Drinks',
      'Home & Entertainment'
    ];
    
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
    const categoryData: CategorySavingsPotential[] = [];
    
    categorySpending.forEach((amount, category) => {
      const isDiscretionary = discretionaryCategories.some(c => 
        category.toLowerCase().includes(c.toLowerCase()) || 
        c.toLowerCase().includes(category.toLowerCase())
      );
      
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
  }, [transactions, savingsGoalPercentage]);
}
