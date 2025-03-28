// src/utils/CardOptimizationAnalyzer.ts
import { Transaction, PaymentMethod } from '@/types';
import { TransactionAnalyzer } from '@/utils/TransactionAnalyzer';

export interface CardSuggestion {
  category: string;
  currentMethod: string;
  suggestedMethod: string;
  potentialSavings: number;
  transactionCount: number;
}

export class CardOptimizationAnalyzer {
  /**
   * Analyze transactions and payment methods to find optimization opportunities
   * @param transactions List of transactions
   * @param paymentMethods Available payment methods
   * @returns Array of card optimization suggestions
   */
  static analyzeCardOptimizations(
    transactions: Transaction[], 
    paymentMethods: PaymentMethod[]
  ): CardSuggestion[] {
    // Group transactions by category
    const categoryGroups = TransactionAnalyzer.groupTransactionsBy(transactions, 'category');
    
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
    
    categoryGroups.forEach((categoryTransactions, category) => {
      // Skip if no transactions
      if (categoryTransactions.length === 0) return;
      
      // Get the current most used payment method
      const currentMethodSpending = new Map<string, number>();
      
      categoryTransactions.forEach(transaction => {
        const method = transaction.paymentMethod?.id || 'Unknown';
        currentMethodSpending.set(
          method, 
          (currentMethodSpending.get(method) || 0) + transaction.amount
        );
      });
      
      // Find the most used method
      let currentMethod = '';
      let maxUsage = 0;
      
      currentMethodSpending.forEach((amount, method) => {
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
        const totalSpent = TransactionAnalyzer.calculateTotalSpending(categoryTransactions);
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
            transactionCount: categoryTransactions.length
          });
        }
      }
    });
    
    // Sort suggestions by potential savings
    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings).slice(0, 3);
  }
}
