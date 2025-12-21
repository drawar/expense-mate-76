/**
 * Budget categories for user-defined transaction categorization.
 * These are the categories users can assign to transactions for spending analysis.
 */
export const BUDGET_CATEGORIES = [
  "Groceries",
  "Food & Drinks",
  "Shopping",
  "Travel",
  "Entertainment",
  "Health & Personal Care",
  "Utilities",
  "Services",
  "Automotive",
  "Education",
  "Home & Rent",
  "Financial Services",
  "Government",
  "Uncategorized",
] as const;

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

/**
 * High-level spending tiers for simplified budget analysis
 */
export const SPENDING_TIERS = ["Essentials", "Lifestyle", "Other"] as const;

export type SpendingTier = (typeof SPENDING_TIERS)[number];

/**
 * Maps detailed categories to high-level spending tiers
 * - Essentials: Fixed/necessary expenses (groceries, utilities, health, home, transport)
 * - Lifestyle: Discretionary spending (dining, shopping, travel, entertainment)
 * - Other: Government, financial services, uncategorized
 */
export const CATEGORY_TO_TIER: Record<BudgetCategory, SpendingTier> = {
  // Essentials (Needs)
  Groceries: "Essentials",
  Utilities: "Essentials",
  "Home & Rent": "Essentials",
  "Health & Personal Care": "Essentials",
  Automotive: "Essentials",

  // Lifestyle (Wants)
  "Food & Drinks": "Lifestyle",
  Shopping: "Lifestyle",
  Travel: "Lifestyle",
  Entertainment: "Lifestyle",
  Services: "Lifestyle",
  Education: "Lifestyle",

  // Other
  "Financial Services": "Other",
  Government: "Other",
  Uncategorized: "Other",
};

/**
 * Get the spending tier for a category
 */
export function getSpendingTier(category: string): SpendingTier {
  return CATEGORY_TO_TIER[category as BudgetCategory] || "Other";
}
