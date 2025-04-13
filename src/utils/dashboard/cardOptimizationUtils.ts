// utils/dashboard/cardOptimizationUtils.ts
import { Transaction, PaymentMethod, Currency } from '@/types';
import { CurrencyService } from '@/services/CurrencyService';

/**
 * Suggestion for optimizing payment method usage
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

// Constants for optimization calculations
const MINIMUM_TRANSACTIONS_PER_CATEGORY = 3;
const DEFAULT_REWARD_RATE = 1; // Assume standard 1x points for baseline comparison
const SAVINGS_MULTIPLIER = 0.01; // Convert percentage to decimal (1% = 0.01)

/**
 * Analyzes payment method optimization opportunities by category
 * 
 * @param transactions Array of transactions to analyze
 * @param paymentMethods Available payment methods
 * @returns Array of optimization suggestions
 */
export function analyzePaymentMethodOptimization(
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): CardSuggestion[] {
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
              if (val !== null && val !== undefined) {
                const valLower = val.toString().toLowerCase();
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
}

/**
 * Calculate the optimal payment method for a given transaction
 */
export function calculateOptimalCard(
  transaction: Transaction,
  paymentMethods: PaymentMethod[]
): PaymentMethod | null {
  // Only consider active credit cards
  const creditCards = paymentMethods.filter(
    method => method.type === 'credit_card' && method.active
  );
  
  if (creditCards.length === 0) return null;
  
  // Calculate estimated points for each card
  const cardScores = creditCards.map(card => {
    let pointsEstimate = 0;
    
    // Basic points (1 point per dollar is standard)
    pointsEstimate += transaction.amount;
    
    // Check for bonus categories based on reward rules
    if (card.rewardRules && card.rewardRules.length > 0) {
      for (const rule of card.rewardRules) {
        if (!rule.enabled) continue;
        
        let ruleApplies = false;
        
        // Check if rule applies based on conditions
        for (const condition of rule.conditions) {
          // Check for MCC condition
          if (condition.type === 'mcc' && transaction.merchant.mcc?.code && 
              condition.values && condition.values.some(code => code === transaction.merchant.mcc?.code)) {
            ruleApplies = true;
            break;
          } 
          // Check for merchant name condition
          else if (condition.type === 'merchant' && Array.isArray(condition.values)) {
            // Check if merchant name contains any of the keywords
            const nameMatch = condition.values.some(keyword => 
              typeof keyword === 'string' && transaction.merchant.name.toLowerCase().includes(keyword.toString().toLowerCase())
            );
            if (nameMatch) {
              ruleApplies = true;
              break;
            }
          } 
          // Check for category condition
          else if (condition.type === 'category' && transaction.category && 
                   Array.isArray(condition.values) && 
                   condition.values.some(cat => cat === transaction.category)) {
            ruleApplies = true;
            break;
          }
        }
        
        // Apply bonus multiplier if rule applies
        if (ruleApplies) {
          // Use the rule's bonus multiplier from the reward property
          // (baseMultiplier - 1 because base points are already counted)
          const bonusMultiplier = rule.reward.baseMultiplier - 1;
          const bonusPoints = transaction.amount * bonusMultiplier;
          
          // Check for monthly cap in reward
          if (rule.reward.monthlyCap) {
            // This is a simplified check - in a real implementation, 
            // you'd need to track year-to-date spend in each category
            pointsEstimate += Math.min(bonusPoints, rule.reward.monthlyCap);
          } else {
            pointsEstimate += bonusPoints;
          }
          
          // Once we find a matching rule, no need to check others
          break;
        }
      }
    }
    
    return {
      card,
      pointsEstimate
    };
  });
  
  // Sort by estimated points (highest first)
  cardScores.sort((a, b) => b.pointsEstimate - a.pointsEstimate);
  
  // Return the card with the highest score
  return cardScores.length > 0 ? cardScores[0].card : null;
}

/**
 * Calculate the total missed optimization opportunities in a set of transactions
 */
export function calculateMissedOptimization(
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): {
  missedPoints: number;
  suboptimalTransactions: Transaction[];
  optimizationScore: number;
} {
  let totalMissedPoints = 0;
  let totalPotentialPoints = 0;
  let totalActualPoints = 0;
  const suboptimalTransactions: Transaction[] = [];
  
  transactions.forEach(transaction => {
    const optimalCard = calculateOptimalCard(transaction, paymentMethods);
    const actualPoints = transaction.rewardPoints || 0;
    totalActualPoints += actualPoints;
    
    if (optimalCard && optimalCard.id !== transaction.paymentMethod.id) {
      // Calculate estimated potential points
      // In a real implementation, you'd use your reward calculation logic
      
      // For now, use a simplified estimate (30% better)
      const estimatedOptimalPoints = actualPoints * 1.3;
      const missedPoints = estimatedOptimalPoints - actualPoints;
      
      totalMissedPoints += missedPoints;
      totalPotentialPoints += estimatedOptimalPoints;
      suboptimalTransactions.push(transaction);
    } else {
      totalPotentialPoints += actualPoints;
    }
  });
  
  // Calculate optimization score (0-100)
  const optimizationScore = totalPotentialPoints > 0 
    ? Math.round((totalActualPoints / totalPotentialPoints) * 100) 
    : 100;
  
  return {
    missedPoints: Math.round(totalMissedPoints),
    suboptimalTransactions,
    optimizationScore
  };
}

/**
 * Calculate the cash value of reward points based on payment method
 */
export function calculateRewardValue(
  points: number, 
  paymentMethod: PaymentMethod
): number {
  // Default value is 0.01 USD per point (1%)
  const defaultValue = 0.01;
  
  // Check if the payment method has categoryRewards defined in rewardRules
  const rewardRules = paymentMethod.rewardRules || [];
  // Use a default value if categoryRewards is not available
  const basePointValue = rewardRules.length > 0 ? 0.01 : defaultValue; 
  
  return points * basePointValue;
}

/**
 * Get the best card recommendation for future purchases in a specific category
 */
export function getBestCardRecommendation(
  transactions: Transaction[],
  paymentMethods: PaymentMethod[]
): { card: PaymentMethod; category: string } | null {
  // Get active cards
  const activeCards = paymentMethods.filter(
    method => method.type === 'credit_card' && method.active
  );
  
  if (activeCards.length === 0 || transactions.length === 0) return null;
  
  // Find the most frequent category
  const categoryCounts = transactions.reduce((acc, tx) => {
    const category = tx.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Find the most common category
  const mostCommonCategory = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // Create a dummy transaction with this category
  const dummyTransaction: Transaction = {
    id: 'dummy',
    date: new Date().toISOString(),
    amount: 100, // Arbitrary amount
    currency: 'USD',
    category: mostCommonCategory,
    merchant: {
      id: 'dummy-merchant',
      name: mostCommonCategory, // Using category as merchant name
      isOnline: false
    },
    paymentAmount: 100,
    paymentCurrency: 'USD',
    paymentMethod: activeCards[0], // Placeholder
    rewardPoints: 0
  };
  
  // Find the best card for this category
  const bestCard = calculateOptimalCard(dummyTransaction, paymentMethods);
  
  if (!bestCard) return null;
  
  return {
    card: bestCard,
    category: mostCommonCategory
  };
}

// Export all functions as a singleton
export const cardOptimizationUtils = {
  analyzePaymentMethodOptimization,
  calculateOptimalCard,
  calculateMissedOptimization,
  calculateRewardValue,
  getBestCardRecommendation
};
