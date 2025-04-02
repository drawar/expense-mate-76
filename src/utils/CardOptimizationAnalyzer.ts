
// Import the CurrencyService instead of the non-existent currencyConversion module
import { CurrencyService } from "@/services/CurrencyService";

// Define CardSuggestion interface that was missing
export interface CardSuggestion {
  category: string;
  currentMethod: string;
  suggestedMethod: string;
  potentialSavings: number;
  transactionCount: number;
}

interface OptimizedPaymentMethodResult {
  paymentMethod: PaymentMethod;
  potentialPoints: number;
  potentialSavings: number;
  actualPoints: number;
  actualSavings: number;
  difference: number;
}

/**
 * Analyzes transactions to determine if better payment methods could have been used
 */
export class CardOptimizationAnalyzer {
  private transactions: Transaction[];
  private paymentMethods: PaymentMethod[];
  
  constructor(transactions: Transaction[], paymentMethods: PaymentMethod[]) {
    this.transactions = transactions;
    this.paymentMethods = paymentMethods;
  }
  
  /**
   * Calculate the cash value of reward points based on payment method
   */
  private calculateRewardValue(points: number, paymentMethod: PaymentMethod): number {
    // Default value is 0.01 USD per point (1%)
    const defaultValue = 0.01;
    
    // In a real implementation, this would check the payment method's reward program
    // and return the appropriate value per point
    
    // Check if the payment method has categoryRewards defined in rewardRules
    const rewardRules = paymentMethod.rewardRules || [];
    // Use a default value if categoryRewards is not available
    const basePointValue = rewardRules.length > 0 ? 0.01 : defaultValue; 
    
    return points * basePointValue;
  }
  
  /**
   * Analyzes a single transaction to find the best payment method
   */
  private analyzeTransaction(transaction: Transaction): OptimizedPaymentMethodResult[] {
    const { amount, currency, paymentMethod } = transaction;
    
    // Filter payment methods to only include active ones
    const activePaymentMethods = this.paymentMethods.filter(pm => pm.active);
    
    // Sort payment methods by potential points in descending order
    const sortedPaymentMethods = [...activePaymentMethods].sort((a, b) => {
      const potentialPointsA = this.calculatePotentialPoints(transaction, a);
      const potentialPointsB = this.calculatePotentialPoints(transaction, b);
      return potentialPointsB - potentialPointsA;
    });
    
    return sortedPaymentMethods.map(pm => {
      const potentialPoints = this.calculatePotentialPoints(transaction, pm);
      const actualPoints = transaction.rewardPoints;
      
      const potentialSavings = this.calculateRewardValue(potentialPoints, pm);
      const actualSavings = this.calculateRewardValue(actualPoints, paymentMethod);
      
      const difference = potentialSavings - actualSavings;
      
      return {
        paymentMethod: pm,
        potentialPoints,
        potentialSavings,
        actualPoints,
        actualSavings,
        difference
      };
    });
  }
  
  /**
   * Calculate potential reward points for a transaction with a given payment method
   */
  private calculatePotentialPoints(transaction: Transaction, paymentMethod: PaymentMethod): number {
    let points = 0;
    const { amount, currency, merchant } = transaction;
    
    // Check each reward rule for the payment method
    paymentMethod.rewardRules.forEach(rule => {
      let multiplier = 0;
      
      switch (rule.type) {
        case 'mcc':
          if (merchant.mcc && rule.condition === merchant.mcc.code) {
            multiplier = rule.pointsMultiplier;
          }
          break;
          
        case 'merchant':
          if (merchant.name === rule.condition) {
            multiplier = rule.pointsMultiplier;
          }
          break;
          
        case 'currency':
          if (currency === rule.condition) {
            multiplier = rule.pointsMultiplier;
          }
          break;
          
        case 'spend_threshold':
          if (amount >= Number(rule.condition)) {
            multiplier = rule.pointsMultiplier;
          }
          break;
          
        case 'online':
          if (merchant.isOnline && rule.condition === 'true') {
            multiplier = rule.pointsMultiplier;
          } else if (!merchant.isOnline && rule.condition === 'false') {
            multiplier = rule.pointsMultiplier;
          }
          break;
          
        case 'contactless':
          if (transaction.isContactless && rule.condition === 'true') {
            multiplier = rule.pointsMultiplier;
          } else if (!transaction.isContactless && rule.condition === 'false') {
            multiplier = rule.pointsMultiplier;
          }
          break;
      }
      
      // Apply the multiplier
      if (multiplier > 0) {
        points += amount * multiplier;
      }
    });
    
    return points;
  }
  
  /**
   * Run the card optimization analysis
   */
  runAnalysis(): OptimizedPaymentMethodResult[][] {
    return this.transactions.map(transaction => this.analyzeTransaction(transaction));
  }
  
  /**
   * Generate card optimization suggestions based on transaction analysis
   */
  analyzeCardOptimizations(): CardSuggestion[] {
    if (!this.transactions.length || !this.paymentMethods.length) {
      return [];
    }
    
    const analysisResults = this.runAnalysis();
    
    // Group transactions by category
    const categories = new Map<string, Transaction[]>();
    this.transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)?.push(tx);
    });
    
    // Create optimization suggestions
    const suggestions: CardSuggestion[] = [];
    
    categories.forEach((categoryTransactions, category) => {
      // Only create suggestions if we have multiple transactions in a category
      if (categoryTransactions.length < 2) return;
      
      // Find the best payment method for this category
      let bestMethod: PaymentMethod | null = null;
      let highestSavings = 0;
      let currentMethodName = '';
      
      // Analyze first transaction as a representative for the category
      const sampleTx = categoryTransactions[0];
      const results = this.analyzeTransaction(sampleTx);
      
      // Find payment method with highest potential savings
      for (const result of results) {
        if (result.difference > highestSavings) {
          highestSavings = result.difference;
          bestMethod = result.paymentMethod;
          currentMethodName = sampleTx.paymentMethod.name;
        }
      }
      
      // If we found a better method with meaningful savings, add to suggestions
      if (bestMethod && highestSavings > 0.1) {
        suggestions.push({
          category,
          currentMethod: currentMethodName,
          suggestedMethod: bestMethod.name,
          potentialSavings: highestSavings * categoryTransactions.length, // Extrapolate to all transactions
          transactionCount: categoryTransactions.length
        });
      }
    });
    
    // Sort suggestions by potential savings (highest first)
    return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }
  
  /**
   * Static method to analyze card optimizations from external components
   */
  static analyzeCardOptimizations(
    transactions: Transaction[], 
    paymentMethods: PaymentMethod[]
  ): CardSuggestion[] {
    if (!transactions.length || !paymentMethods.length) {
      return [];
    }
    
    const analyzer = new CardOptimizationAnalyzer(transactions, paymentMethods);
    return analyzer.analyzeCardOptimizations();
  }
}
