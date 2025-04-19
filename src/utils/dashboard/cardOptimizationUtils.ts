import { PaymentMethod, Transaction } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { safelyParseNumber } from "../errorHandling";
import { RewardService } from "@/core/rewards/RewardService";

/**
 * Represents a spending category with its total spend amount
 */
export interface CategorySpend {
  category: string;
  spend: number;
}

/**
 * Detailed recommendation for card optimization
 */
export interface CardOptimizationRecommendation {
  topCategories: CategorySpend[];
  underutilizedMethods: PaymentMethod[];
  potentialSavings: number;
  bestMethodsByCategory: Record<string, PaymentMethod[]>;
}

/**
 * Card recommendation by category with estimated savings
 */
export interface CardRecommendation {
  paymentMethod: PaymentMethod;
  category: string;
  currentRewards: number;
  potentialRewards: number;
  savingsPercentage: number;
}

/**
 * Calculates spending statistics by category
 */
export class CategoryAnalyzer {
  /**
   * Calculate total spend for a given category
   */
  public static calculateCategorySpend(
    transactions: Transaction[],
    category: string
  ): number {
    return transactions
      .filter((transaction) => transaction.category === category)
      .reduce(
        (sum, transaction) => sum + safelyParseNumber(transaction.amount, 0),
        0
      );
  }

  /**
   * Calculate total rewards earned for a given category
   */
  public static calculateCategoryRewards(
    transactions: Transaction[],
    category: string
  ): number {
    return transactions
      .filter((transaction) => transaction.category === category)
      .reduce(
        (sum, transaction) =>
          sum + safelyParseNumber(transaction.rewardPoints, 0),
        0
      );
  }

  /**
   * Identify top spending categories by total amount
   */
  public static identifyTopSpendingCategories(
    transactions: Transaction[],
    limit: number = 3
  ): CategorySpend[] {
    // Use a Map for better performance with potentially large datasets
    const categorySpendMap = new Map<string, number>();

    // Calculate total spend by category
    for (const transaction of transactions) {
      const category = transaction.category || "Uncategorized";
      const currentSpend = categorySpendMap.get(category) || 0;
      categorySpendMap.set(
        category,
        currentSpend + safelyParseNumber(transaction.amount, 0)
      );
    }

    // Convert map to array, sort, and limit results
    return Array.from(categorySpendMap.entries())
      .map(([category, spend]) => ({ category, spend }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, limit);
  }

  /**
   * Group transactions by category for efficient analysis
   */
  public static groupTransactionsByCategory(
    transactions: Transaction[]
  ): Map<string, Transaction[]> {
    const categorizedTransactions = new Map<string, Transaction[]>();

    for (const transaction of transactions) {
      const category = transaction.category || "Uncategorized";
      if (!categorizedTransactions.has(category)) {
        categorizedTransactions.set(category, []);
      }
      categorizedTransactions.get(category)?.push(transaction);
    }

    return categorizedTransactions;
  }
}

/**
 * Analyzes payment method usage and optimization
 */
export class PaymentMethodAnalyzer {
  private rewardService: RewardService;

  constructor(rewardService?: RewardService) {
    this.rewardService = rewardService || new RewardService();
  }

  /**
   * Identify payment methods that are used less frequently than expected
   */
  public identifyUnderutilizedPaymentMethods(
    transactions: Transaction[],
    paymentMethods: PaymentMethod[],
    minTransactions: number = 5
  ): PaymentMethod[] {
    const paymentMethodUsage = new Map<string, number>();

    // Count usage of each payment method
    for (const transaction of transactions) {
      const methodId = transaction.paymentMethod.id;
      paymentMethodUsage.set(
        methodId,
        (paymentMethodUsage.get(methodId) || 0) + 1
      );
    }

    // Filter methods that are used less than the minimum threshold
    return paymentMethods.filter((method) => {
      // Only include active credit cards
      if (!method.active || method.type !== "credit_card") {
        return false;
      }
      return (paymentMethodUsage.get(method.id) || 0) < minTransactions;
    });
  }

  /**
   * Calculate potential rewards using a specific payment method for a category
   */
  public calculatePotentialRewards(
    categoryTransactions: Transaction[],
    paymentMethod: PaymentMethod
  ): number {
    if (!categoryTransactions.length) {
      return 0;
    }

    let totalRewards = 0;

    // Use the actual transactions but simulate using the alternative payment method
    for (const transaction of categoryTransactions) {
      // Create a simulated transaction with the alternative payment method
      const simulatedTransaction = {
        ...transaction,
        paymentMethod: paymentMethod,
      };

      // Calculate rewards using the reward service
      const rewardResult =
        this.rewardService.calculateRewards(simulatedTransaction);
      totalRewards += rewardResult.totalPoints;
    }

    return totalRewards;
  }

  /**
   * Identify the best payment method for each category
   */
  public identifyBestPaymentMethodsByCategory(
    categorizedTransactions: Map<string, Transaction[]>,
    paymentMethods: PaymentMethod[]
  ): Record<string, PaymentMethod[]> {
    const results: Record<string, PaymentMethod[]> = {};

    // For each category, find the payment methods that maximize rewards
    for (const [category, transactions] of categorizedTransactions.entries()) {
      if (!transactions.length) {
        continue;
      }

      // Calculate total category spend
      const totalCategorySpend = transactions.reduce(
        (sum, tx) => sum + safelyParseNumber(tx.amount, 0),
        0
      );

      if (totalCategorySpend <= 0) {
        continue;
      }

      // Calculate current rewards
      const currentRewards = transactions.reduce(
        (sum, tx) => sum + safelyParseNumber(tx.rewardPoints, 0),
        0
      );

      // Calculate potential rewards for each payment method
      const methodRewards = paymentMethods
        .filter((method) => method.active && method.type === "credit_card")
        .map((method) => ({
          method,
          rewards: this.calculatePotentialRewards(transactions, method),
        }))
        .filter((result) => result.rewards > currentRewards) // Only keep methods that improve rewards
        .sort((a, b) => b.rewards - a.rewards); // Sort by highest rewards first

      // Store the top methods
      results[category] = methodRewards.slice(0, 3).map((item) => item.method);
    }

    return results;
  }

  /**
   * Calculate total rewards that could be earned by using optimal cards
   */
  public calculateOptimalTotalRewards(
    categorizedTransactions: Map<string, Transaction[]>,
    bestMethodsByCategory: Record<string, PaymentMethod[]>
  ): number {
    let optimalRewards = 0;

    for (const [category, transactions] of categorizedTransactions.entries()) {
      const bestMethods = bestMethodsByCategory[category];

      if (bestMethods && bestMethods.length > 0) {
        // Use the best method for this category
        optimalRewards += this.calculatePotentialRewards(
          transactions,
          bestMethods[0]
        );
      } else {
        // Use current rewards if no better method is found
        optimalRewards += transactions.reduce(
          (sum, tx) => sum + safelyParseNumber(tx.rewardPoints, 0),
          0
        );
      }
    }

    return optimalRewards;
  }
}

/**
 * Main optimization engine that provides recommendations
 */
export class CardOptimizationEngine {
  private categoryAnalyzer = CategoryAnalyzer;
  private paymentMethodAnalyzer: PaymentMethodAnalyzer;

  constructor(rewardService?: RewardService) {
    this.paymentMethodAnalyzer = new PaymentMethodAnalyzer(rewardService);
  }

  /**
   * Generate comprehensive card optimization recommendations
   */
  public generateRecommendations(
    transactions: Transaction[],
    paymentMethods: PaymentMethod[],
    options: {
      topCategoriesLimit?: number;
      minTransactions?: number;
    } = {}
  ): CardOptimizationRecommendation {
    const { topCategoriesLimit = 3, minTransactions = 5 } = options;

    // Skip analysis if there's insufficient data
    if (!transactions.length || !paymentMethods.length) {
      return {
        topCategories: [],
        underutilizedMethods: [],
        potentialSavings: 0,
        bestMethodsByCategory: {},
      };
    }

    // 1. Identify top spending categories
    const topCategories = this.categoryAnalyzer.identifyTopSpendingCategories(
      transactions,
      topCategoriesLimit
    );

    // 2. Group transactions by category for efficient processing
    const categorizedTransactions =
      this.categoryAnalyzer.groupTransactionsByCategory(transactions);

    // 3. Identify underutilized payment methods
    const underutilizedMethods =
      this.paymentMethodAnalyzer.identifyUnderutilizedPaymentMethods(
        transactions,
        paymentMethods,
        minTransactions
      );

    // 4. Identify the best payment methods for each category
    const bestMethodsByCategory =
      this.paymentMethodAnalyzer.identifyBestPaymentMethodsByCategory(
        categorizedTransactions,
        paymentMethods
      );

    // 5. Calculate the current total rewards
    const currentTotalRewards = transactions.reduce(
      (sum, tx) => sum + safelyParseNumber(tx.rewardPoints, 0),
      0
    );

    // 6. Calculate the optimal total rewards
    const optimalTotalRewards =
      this.paymentMethodAnalyzer.calculateOptimalTotalRewards(
        categorizedTransactions,
        bestMethodsByCategory
      );

    // 7. Calculate potential savings (additional rewards)
    const potentialSavings = Math.max(
      0,
      optimalTotalRewards - currentTotalRewards
    );

    return {
      topCategories,
      underutilizedMethods,
      potentialSavings,
      bestMethodsByCategory,
    };
  }

  /**
   * Calculate the rewards rate (rewards per dollar spent)
   */
  public calculateRewardsRate(transactions: Transaction[]): number {
    const totalSpend = transactions.reduce(
      (sum, tx) => sum + safelyParseNumber(tx.amount, 0),
      0
    );

    const totalRewards = transactions.reduce(
      (sum, tx) => sum + safelyParseNumber(tx.rewardPoints, 0),
      0
    );

    return totalSpend > 0 ? totalRewards / totalSpend : 0;
  }

  /**
   * Identify transactions with high spending amounts
   */
  public identifyHighSpendTransactions(
    transactions: Transaction[],
    threshold: number = 100
  ): Transaction[] {
    return transactions.filter(
      (tx) => safelyParseNumber(tx.amount, 0) > threshold
    );
  }
}

/**
 * Create and export a singleton instance of the optimization engine
 */
export const cardOptimizationEngine = new CardOptimizationEngine();

/**
 * Simplified public API for card optimization analysis
 */
export const cardOptimizationUtils = {
  /**
   * Analyze spending patterns and provide optimization recommendations
   */
  analyzeSpending(
    transactions: Transaction[],
    paymentMethods: PaymentMethod[],
    options = {}
  ): CardOptimizationRecommendation {
    return cardOptimizationEngine.generateRecommendations(
      transactions,
      paymentMethods,
      options
    );
  },

  /**
   * Calculate the rewards rate for a set of transactions
   */
  calculateRewardsRate(transactions: Transaction[]): number {
    return cardOptimizationEngine.calculateRewardsRate(transactions);
  },

  /**
   * Identify transactions with spending above a threshold
   */
  findHighSpendTransactions(
    transactions: Transaction[],
    threshold?: number
  ): Transaction[] {
    return cardOptimizationEngine.identifyHighSpendTransactions(
      transactions,
      threshold
    );
  },

  /**
   * Get top spending categories
   */
  getTopCategories(
    transactions: Transaction[],
    limit?: number
  ): CategorySpend[] {
    return CategoryAnalyzer.identifyTopSpendingCategories(transactions, limit);
  },
};
