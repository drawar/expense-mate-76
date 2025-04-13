// hooks/dashboard/useInsightData.ts
import { useMemo } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { 
  DISCRETIONARY_CATEGORIES, 
  DISCRETIONARY_SAVINGS_RATE, 
  ESSENTIAL_SAVINGS_RATE,
  TOP_CATEGORIES_COUNT,
  MINIMUM_TRANSACTIONS_PER_CATEGORY,
  DEFAULT_REWARD_RATE,
  SAVINGS_MULTIPLIER
} from '@/utils/dashboard';

/**
 * Interface for card optimization suggestions
 */
export interface CardSuggestion {
  /** Category name where optimization is possible */
  category: string;
  /** Number of transactions in this category */
  transactionCount: number;
  /** Currently used payment method */
  currentMethod: string;
  /** Recommended payment method for better rewards */
  suggestedMethod: string;
  /** Estimated monthly savings/additional rewards when using suggested method */
  potentialSavings: number;
}

/**
 * Hook for generating payment method optimization recommendations
 * Analyzes transaction patterns and suggests better card choices per category
 * Optimized for performance with large datasets
 * 
 * @param transactions - Array of transactions to analyze
 * @param paymentMethods - Available payment methods to consider
 * @returns Array of card optimization suggestions
 */
export function usePaymentMethodOptimization(
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): CardSuggestion[] {
  return useMemo(() => {
    // Skip processing if there's insufficient data (early return)
    if (transactions.length === 0 || paymentMethods.length < 2) {
      return [];
    }

    // Pre-processing: Cache active payment methods to avoid repeated checks
    const activePaymentMethods = paymentMethods.filter(method => method.active);
    if (activePaymentMethods.length < 2) return []; // Need at least 2 active methods
    
    // Pre-compute payment method reward rules for faster lookup
    const methodRewardMap = new Map<string, {
      methodName: string;
      categoryRules: Map<string, number>;
      defaultRate: number;
    }>();
    
    // Pre-process payment methods and their rules for faster lookups
    activePaymentMethods.forEach(method => {
      const categoryRules = new Map<string, number>();
      let defaultRate = DEFAULT_REWARD_RATE; // Default if no rules found
      
      // Check if the payment method has rewardRules defined
      if (method.rewardRules) {
        method.rewardRules.forEach(rule => {
          // Make sure the rule is enabled
          if (!rule.enabled) return;
          
          // Look for rules that would apply to categories or merchants
          for (const condition of rule.conditions) {
            // Check for category or merchant specific conditions
            if ((condition.type === 'mcc' || condition.type === 'merchant' || condition.type === 'category') && 
                condition.values && 
                Array.isArray(condition.values)) {
              
              // Store lowercase values for case-insensitive matching
              condition.values.forEach(val => {
                if (typeof val === 'string') {
                  const valLower = val.toLowerCase();
                  // Use the base multiplier from the reward as the points multiplier
                  const multiplier = rule.reward.baseMultiplier;
                  categoryRules.set(valLower, Math.max(
                    categoryRules.get(valLower) || 0, 
                    multiplier
                  ));
                }
              });
            } 
            // Look for generic conditions
            else if (condition.type === 'currency' || condition.type === 'spend_threshold') {
              // This is likely a generic rule for all transactions
              defaultRate = Math.max(defaultRate, rule.reward.baseMultiplier);
            }
          }
          
          // If there are no specific conditions, treat as a default rule
          if (rule.conditions.length === 0) {
            defaultRate = Math.max(defaultRate, rule.reward.baseMultiplier);
          }
        });
      }
      
      methodRewardMap.set(method.name, {
        methodName: method.name,
        categoryRules,
        defaultRate
      });
    });
    
    // Optimized data structures for category analysis (single pass)
    type CategoryData = {
      transactions: number;
      amount: number;
      methods: Map<string, { count: number; amount: number }>;
      lowerCaseName: string;
    };
    
    const categoryDataMap = new Map<string, CategoryData>();
    
    // Process all transactions in a single pass
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      const methodName = tx.paymentMethod?.name || 'Unknown';
      const amount = tx.amount;
      
      // Get or create category data
      let catData = categoryDataMap.get(category);
      if (!catData) {
        catData = {
          transactions: 0,
          amount: 0,
          methods: new Map(),
          lowerCaseName: category.toLowerCase()
        };
        categoryDataMap.set(category, catData);
      }
      
      // Update category totals
      catData.transactions++;
      catData.amount += amount;
      
      // Update method usage within category
      let methodData = catData.methods.get(methodName);
      if (!methodData) {
        methodData = { count: 0, amount: 0 };
        catData.methods.set(methodName, methodData);
      }
      methodData.count++;
      methodData.amount += amount;
    });
    
    // Process categories to find optimization opportunities (single pass)
    const results: CardSuggestion[] = [];
    
    categoryDataMap.forEach((catData, category) => {
      // Skip categories with too few transactions
      if (catData.transactions < MINIMUM_TRANSACTIONS_PER_CATEGORY) return;
      
      // Find predominant payment method for this category
      let currentMethod = '';
      let currentMethodCount = 0;
      let currentMethodAmount = 0;
      
      catData.methods.forEach((data, method) => {
        if (data.count > currentMethodCount) {
          currentMethod = method;
          currentMethodCount = data.count;
          currentMethodAmount = data.amount;
        }
      });
      
      if (!currentMethod) return; // Skip if no method found
      
      // Find the best rewards card for this category
      let bestMethod = currentMethod;
      let bestReward = DEFAULT_REWARD_RATE; // Start with assumption of 1x for current
      
      // Get the current method's reward info if available
      const currentMethodInfo = methodRewardMap.get(currentMethod);
      if (currentMethodInfo) {
        bestReward = currentMethodInfo.defaultRate;
      }
      
      // Check each payment method for better rewards
      methodRewardMap.forEach((methodInfo, methodName) => {
        if (methodName === currentMethod) return; // Skip current method
        
        // Start with default rate
        let potentialReward = methodInfo.defaultRate;
        
        // Check for category-specific rules that might apply
        // Use the pre-computed category rules for faster lookup
        const categoryLower = catData.lowerCaseName;
        
        // Check exact category match first (most efficient)
        if (methodInfo.categoryRules.has(categoryLower)) {
          potentialReward = Math.max(potentialReward, methodInfo.categoryRules.get(categoryLower)!);
        } else {
          // Check partial matches if no exact match found
          methodInfo.categoryRules.forEach((rate, ruleCat) => {
            if (categoryLower.includes(ruleCat) || ruleCat.includes(categoryLower)) {
              potentialReward = Math.max(potentialReward, rate);
            }
          });
        }
        
        // Update best method if we found a better one
        if (potentialReward > bestReward) {
          bestReward = potentialReward;
          bestMethod = methodName;
        }
      });
      
      // If we found a better method, add it to suggestions
      if (bestMethod !== currentMethod) {
        // Get current method's reward rate
        const currentReward = currentMethodInfo?.defaultRate || DEFAULT_REWARD_RATE;
        const potentialSavings = currentMethodAmount * (bestReward - currentReward) * SAVINGS_MULTIPLIER;
        
        // Only add suggestions with meaningful savings
        if (potentialSavings > 0) {
          results.push({
            category,
            transactionCount: currentMethodCount,
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
  /** Category name */
  category: string;
  /** Total spending amount in this category */
  amount: number;
  /** Estimated potential savings amount */
  savingsPotential: number;
  /** Whether this is considered discretionary (non-essential) spending */
  discretionary: boolean;
}

/**
 * Interface for the complete savings analysis result
 */
export interface SavingsAnalysis {
  /** Total spending across all categories */
  totalSpending: number;
  /** Total discretionary (non-essential) spending */
  discretionarySpending: number;
  /** Target savings amount based on goal percentage */
  savingsTarget: number;
  /** Total potential savings amount across all categories */
  savingsPotential: number;
  /** Top discretionary categories with savings opportunities */
  topDiscretionaryCategories: CategorySavingsPotential[];
  /** Progress toward savings goal (as percentage) */
  savingsProgress: number;
}

/**
 * Hook for analyzing spending patterns to identify savings opportunities
 * Optimized for performance with large datasets
 * 
 * @param transactions - Transactions to analyze
 * @param savingsGoalPercentage - Target percentage of total spending to save
 * @returns Detailed savings analysis
 */
export function useSavingsPotential(
  transactions: Transaction[],
  savingsGoalPercentage: number = 20
): SavingsAnalysis {
  return useMemo(() => {
    // Early return for empty data to avoid unnecessary processing
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
    
    let totalSpending = 0;
    let discretionarySpending = 0;
    let totalSavingsPotential = 0;
    
    // Category data storage with category name as key for faster lookups
    const categoryData = new Map<string, CategorySavingsPotential>();
    
    // Single pass algorithm - process all transactions in one loop
    transactions.forEach(tx => {
      const amount = tx.amount;
      const category = tx.category || 'Uncategorized';
      const categoryLower = category.toLowerCase();
      
      // Add to total spending
      totalSpending += amount;
      
      // Get or create category data entry
      let catData = categoryData.get(category);
      if (!catData) {
        // Check if this is a discretionary category (case-insensitive)
        // Using the Set for O(1) lookups instead of array iteration
        const isDiscretionary = DISCRETIONARY_CATEGORIES.has(categoryLower) ||
          Array.from(DISCRETIONARY_CATEGORIES).some(c => 
            categoryLower.includes(c) || c.includes(categoryLower)
          );
        
        catData = {
          category,
          amount: 0,
          discretionary: isDiscretionary,
          savingsPotential: 0
        };
        categoryData.set(category, catData);
      }
      
      // Update category amount
      catData.amount += amount;
      
      // Recalculate savings potential for this category
      const savingsRate = catData.discretionary ? DISCRETIONARY_SAVINGS_RATE : ESSENTIAL_SAVINGS_RATE;
      catData.savingsPotential = catData.amount * savingsRate;
      
      // Update discretionary spending total
      if (catData.discretionary) {
        discretionarySpending += amount;
      }
      
      // Update total savings potential
      totalSavingsPotential = 0; // Will recalculate below
    });
    
    // Calculate total savings potential from all categories
    categoryData.forEach(cat => {
      totalSavingsPotential += cat.savingsPotential;
    });
    
    // Calculate savings target based on goal percentage
    const savingsTarget = totalSpending * (savingsGoalPercentage / 100);
    
    // Calculate savings progress as percentage of target (capped at 100%)
    const savingsProgress = Math.min(
      100, 
      totalSavingsPotential > 0 && savingsTarget > 0 ? 
        (totalSavingsPotential / savingsTarget) * 100 : 0
    );
    
    // Find top discretionary categories more efficiently
    // Instead of filtering and sorting the entire array, we maintain a top N list
    const topCategories: CategorySavingsPotential[] = [];
    
    categoryData.forEach(catData => {
      if (!catData.discretionary) return; // Skip non-discretionary categories
      
      // Special case for first few items to avoid unnecessary comparisons
      if (topCategories.length < TOP_CATEGORIES_COUNT) {
        topCategories.push(catData);
        // Sort after pushing to maintain descending order by savingsPotential
        topCategories.sort((a, b) => b.savingsPotential - a.savingsPotential);
        return;
      }
      
      // Check if this category should replace the lowest in the top list
      const lowestTopIndex = topCategories.length - 1;
      if (catData.savingsPotential > topCategories[lowestTopIndex].savingsPotential) {
        // Replace the lowest entry and resort
        topCategories[lowestTopIndex] = catData;
        topCategories.sort((a, b) => b.savingsPotential - a.savingsPotential);
      }
    });
    
    return {
      totalSpending,
      discretionarySpending,
      savingsTarget,
      savingsPotential: totalSavingsPotential,
      topDiscretionaryCategories: topCategories,
      savingsProgress
    };
  }, [transactions, savingsGoalPercentage]);
}
