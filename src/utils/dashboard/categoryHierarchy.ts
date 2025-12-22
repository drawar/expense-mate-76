/**
 * Category Hierarchy Utilities
 *
 * Transforms flat category spending data into hierarchical parent/subcategory structure
 * for the new dashboard spending breakdown view.
 */

import {
  PARENT_CATEGORIES,
  SUBCATEGORIES,
  SUBCATEGORY_TO_PARENT,
  CategoryConfig,
  SubcategoryConfig,
} from "@/utils/constants/categories";
import { Transaction, Currency } from "@/types";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import { CurrencyService } from "@/core/currency";

// =============================================================================
// Types
// =============================================================================

export interface SubcategorySpending {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  percentage: number; // Percentage of parent total
  transactionCount: number;
}

export interface ParentCategorySpending {
  id: string;
  name: string;
  emoji: string;
  color: string;
  amount: number;
  percentage: number; // Percentage of total spending
  subcategories: SubcategorySpending[];
  budgetPriority: string;
  savingsPotential: string;
}

export interface HierarchicalSpendingData {
  totalSpending: number;
  categories: ParentCategorySpending[];
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find the subcategory config by name (case-insensitive)
 */
function findSubcategoryConfig(
  categoryName: string
): SubcategoryConfig | undefined {
  return SUBCATEGORIES.find(
    (s) => s.name.toLowerCase() === categoryName.toLowerCase()
  );
}

/**
 * Find parent category config by subcategory name
 */
function findParentForSubcategory(
  categoryName: string
): CategoryConfig | undefined {
  return SUBCATEGORY_TO_PARENT[categoryName];
}

// =============================================================================
// Main Functions
// =============================================================================

/**
 * Transform transactions into hierarchical category spending data
 * @param transactions - Array of transactions to categorize
 * @param displayCurrency - Currency to convert all amounts to (optional, defaults to no conversion)
 */
export function buildCategoryHierarchy(
  transactions: Transaction[],
  displayCurrency?: Currency
): HierarchicalSpendingData {
  if (!transactions || transactions.length === 0) {
    return { totalSpending: 0, categories: [] };
  }

  // Step 1: Aggregate spending by subcategory
  const subcategoryMap = new Map<string, { amount: number; count: number }>();

  let totalSpending = 0;

  transactions.forEach((tx) => {
    const category = getEffectiveCategory(tx);

    // Convert amount to display currency if specified
    let amount = tx.amount;
    if (displayCurrency && tx.currency !== displayCurrency) {
      try {
        amount = CurrencyService.convert(
          tx.amount,
          tx.currency as Currency,
          displayCurrency,
          tx.paymentMethod
        );
      } catch (error) {
        // Fall back to original amount if conversion fails
        console.warn("Currency conversion failed for transaction:", tx.id);
      }
    }

    totalSpending += amount;

    const existing = subcategoryMap.get(category) || { amount: 0, count: 0 };
    subcategoryMap.set(category, {
      amount: existing.amount + amount,
      count: existing.count + 1,
    });
  });

  // Step 2: Group subcategories by parent category
  const parentMap = new Map<
    string,
    {
      config: CategoryConfig;
      subcategories: Map<
        string,
        { config: SubcategoryConfig; amount: number; count: number }
      >;
      totalAmount: number;
    }
  >();

  // Initialize parent categories
  PARENT_CATEGORIES.forEach((parent) => {
    parentMap.set(parent.id, {
      config: parent,
      subcategories: new Map(),
      totalAmount: 0,
    });
  });

  // Assign subcategories to parents
  subcategoryMap.forEach((data, categoryName) => {
    const subcategoryConfig = findSubcategoryConfig(categoryName);
    const parentConfig = findParentForSubcategory(categoryName);

    if (subcategoryConfig && parentConfig) {
      const parent = parentMap.get(parentConfig.id);
      if (parent) {
        parent.subcategories.set(categoryName, {
          config: subcategoryConfig,
          amount: data.amount,
          count: data.count,
        });
        parent.totalAmount += data.amount;
      }
    } else {
      // Unknown category - add to "Financial & Other"
      const fallbackParent = parentMap.get("financial_other");
      if (fallbackParent) {
        fallbackParent.subcategories.set(categoryName, {
          config: {
            id: categoryName.toLowerCase().replace(/\s+/g, "_"),
            name: categoryName,
            parentCategory: "financial_other",
            emoji: "📦",
            description: "Uncategorized spending",
          },
          amount: data.amount,
          count: data.count,
        });
        fallbackParent.totalAmount += data.amount;
      }
    }
  });

  // Step 3: Build final hierarchical structure
  const categories: ParentCategorySpending[] = [];

  parentMap.forEach((parent) => {
    // Skip empty parent categories
    if (parent.totalAmount === 0) return;

    // Sort subcategories by amount (descending)
    const sortedSubcategories = Array.from(parent.subcategories.entries())
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, data]) => ({
        id: data.config.id,
        name: data.config.name,
        emoji: data.config.emoji,
        amount: data.amount,
        percentage:
          parent.totalAmount > 0 ? (data.amount / parent.totalAmount) * 100 : 0,
        transactionCount: data.count,
      }));

    categories.push({
      id: parent.config.id,
      name: parent.config.name,
      emoji: parent.config.emoji,
      color: parent.config.color,
      amount: parent.totalAmount,
      percentage:
        totalSpending > 0 ? (parent.totalAmount / totalSpending) * 100 : 0,
      subcategories: sortedSubcategories,
      budgetPriority: parent.config.budgetPriority,
      savingsPotential: parent.config.savingsPotential,
    });
  });

  // Sort parent categories by amount (descending)
  categories.sort((a, b) => b.amount - a.amount);

  return {
    totalSpending,
    categories,
  };
}

/**
 * Get spending data for a specific parent category
 */
export function getParentCategoryDetails(
  transactions: Transaction[],
  parentCategoryId: string
): ParentCategorySpending | null {
  const hierarchy = buildCategoryHierarchy(transactions);
  return hierarchy.categories.find((c) => c.id === parentCategoryId) || null;
}

/**
 * Calculate month-over-month change for a category
 */
export function calculateCategoryChange(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[],
  categoryName: string
): { amount: number; percentage: number } {
  const getCategoryTotal = (txs: Transaction[], cat: string) => {
    return txs
      .filter((tx) => getEffectiveCategory(tx) === cat)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  const current = getCategoryTotal(currentTransactions, categoryName);
  const previous = getCategoryTotal(previousTransactions, categoryName);

  const change = current - previous;
  const percentChange =
    previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return {
    amount: change,
    percentage: percentChange,
  };
}
