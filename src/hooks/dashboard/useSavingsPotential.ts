// hooks/dashboard/useSavingsPotential.ts
import { useMemo } from 'react';
import { Transaction } from '@/types';

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

// Define discretionary spending categories once instead of in every render
const DISCRETIONARY_CATEGORIES = new Set([
  'entertainment', 'dining', 'shopping', 'leisure',
  'subscriptions', 'travel', 'hobbies', 'gifts',
  'alcohol', 'coffee', 'electronics', 'clothing',
  'beauty', 'fast food', 'food & drinks', 'food and drinks',
  'home & entertainment', 'restaurants'
].map(cat => cat.toLowerCase()));

// Constants for savings calculations to avoid magic numbers
const DISCRETIONARY_SAVINGS_RATE = 0.3; // 30% potential savings on discretionary spending
const ESSENTIAL_SAVINGS_RATE = 0.05;    // 5% potential savings on essential spending
const TOP_CATEGORIES_COUNT = 3;         // Number of top categories to return

/**
 * Hook for analyzing spending patterns to identify savings opportunities
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
      
      // Add to total spending (replaces the first reduce)
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

export default useSavingsPotential;
