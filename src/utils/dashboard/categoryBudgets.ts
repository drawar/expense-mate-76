// utils/dashboard/categoryBudgets.ts
/**
 * Calculate proportional budgets for categories based on historical spending patterns
 */

import { Transaction, Currency } from "@/types";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { getEffectiveCategory } from "@/utils/categoryMapping";

export interface CategoryBudget {
  name: string;
  proportionalBudget: number;
  historicalPercentage: number;
  currentSpend: number;
  variance: number; // positive = over, negative = under
}

/**
 * Calculate proportional budgets for each category based on historical spending
 * Uses last 3 months of data to determine typical spending distribution
 */
export function calculateCategoryBudgets(
  allTransactions: Transaction[],
  currentPeriodTransactions: Transaction[],
  overallBudget: number,
  displayCurrency: Currency
): CategoryBudget[] {
  if (overallBudget <= 0) {
    return [];
  }

  // Get transactions from last 3 months for historical baseline
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const historicalTransactions = allTransactions.filter((tx) => {
    const txDate = new Date(tx.date);
    return (
      txDate >= threeMonthsAgo &&
      txDate < new Date(now.getFullYear(), now.getMonth(), 1)
    );
  });

  // If no historical data, use current period data
  const baseTransactions =
    historicalTransactions.length > 0
      ? historicalTransactions
      : currentPeriodTransactions;

  // Calculate historical spending by category
  const historicalByCategory = new Map<string, number>();
  let historicalTotal = 0;

  baseTransactions.forEach((tx) => {
    if (tx.amount > 0) {
      const category = getEffectiveCategory(tx) || "Other";
      const amount = CurrencyService.convert(
        tx.paymentAmount ?? tx.amount,
        tx.paymentCurrency ?? tx.currency,
        displayCurrency
      );
      historicalByCategory.set(
        category,
        (historicalByCategory.get(category) || 0) + amount
      );
      historicalTotal += amount;
    }
  });

  // Calculate current period spending by category
  const currentByCategory = new Map<string, number>();

  currentPeriodTransactions.forEach((tx) => {
    if (tx.amount > 0) {
      const category = getEffectiveCategory(tx) || "Other";
      const amount = CurrencyService.convert(
        tx.paymentAmount ?? tx.amount,
        tx.paymentCurrency ?? tx.currency,
        displayCurrency
      );
      currentByCategory.set(
        category,
        (currentByCategory.get(category) || 0) + amount
      );
    }
  });

  // Get all unique categories from both periods
  const allCategories = new Set([
    ...historicalByCategory.keys(),
    ...currentByCategory.keys(),
  ]);

  // Calculate proportional budgets and variances
  const categoryBudgets: CategoryBudget[] = [];

  allCategories.forEach((category) => {
    const historicalAmount = historicalByCategory.get(category) || 0;
    const historicalPercentage =
      historicalTotal > 0 ? historicalAmount / historicalTotal : 0;
    const proportionalBudget = overallBudget * historicalPercentage;
    const currentSpend = currentByCategory.get(category) || 0;
    const variance = currentSpend - proportionalBudget;

    categoryBudgets.push({
      name: category,
      proportionalBudget,
      historicalPercentage,
      currentSpend,
      variance,
    });
  });

  // Sort by variance (biggest overspend first)
  categoryBudgets.sort((a, b) => b.variance - a.variance);

  return categoryBudgets;
}

/**
 * Get the category with the largest overspend
 */
export function getLargestOverspendCategory(
  categoryBudgets: CategoryBudget[]
): CategoryBudget | null {
  const overBudget = categoryBudgets.filter((c) => c.variance > 0);
  if (overBudget.length === 0) return null;
  return overBudget[0]; // Already sorted by variance desc
}

/**
 * Get the largest transaction in a specific category
 */
export function getLargestTransactionInCategory(
  transactions: Transaction[],
  categoryName: string,
  displayCurrency: Currency
): { merchant: string; amount: number } | null {
  const categoryTransactions = transactions.filter((tx) => {
    const category = getEffectiveCategory(tx) || "Other";
    return category === categoryName && tx.amount > 0;
  });

  if (categoryTransactions.length === 0) return null;

  const largest = categoryTransactions.reduce((max, tx) => {
    const amount = CurrencyService.convert(
      tx.paymentAmount ?? tx.amount,
      tx.paymentCurrency ?? tx.currency,
      displayCurrency
    );
    const maxAmount = CurrencyService.convert(
      max.paymentAmount ?? max.amount,
      max.paymentCurrency ?? max.currency,
      displayCurrency
    );
    return amount > maxAmount ? tx : max;
  });

  return {
    merchant: largest.merchant?.name || "Unknown",
    amount: CurrencyService.convert(
      largest.paymentAmount ?? largest.amount,
      largest.paymentCurrency ?? largest.currency,
      displayCurrency
    ),
  };
}
