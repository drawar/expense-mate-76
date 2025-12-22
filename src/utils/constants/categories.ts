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

/**
 * Behavioral spending categories for psychological analysis
 */
export const BEHAVIORAL_CATEGORIES = [
  "Convenience",
  "Social",
  "Planned",
  "Investment",
] as const;

export type BehavioralCategory = (typeof BEHAVIORAL_CATEGORIES)[number];

/**
 * Maps detailed categories to behavioral categories
 * - Convenience: Easy/impulse spending (delivery, rideshare)
 * - Social: Spending with others (dining out, entertainment)
 * - Planned: Intentional purchases (groceries, essentials)
 * - Investment: Future-focused (education, health)
 */
export const CATEGORY_TO_BEHAVIOR: Record<BudgetCategory, BehavioralCategory> =
  {
    // Convenience (Lazy Money)
    "Food & Drinks": "Convenience",
    Services: "Convenience",

    // Social spending
    Entertainment: "Social",
    Travel: "Social",

    // Planned spending
    Groceries: "Planned",
    Shopping: "Planned",
    "Home & Rent": "Planned",
    Utilities: "Planned",
    Automotive: "Planned",

    // Investment in self
    "Health & Personal Care": "Investment",
    Education: "Investment",

    // Default to Planned
    "Financial Services": "Planned",
    Government: "Planned",
    Uncategorized: "Planned",
  };

/**
 * Get the behavioral category for a spending category
 */
export function getBehavioralCategory(category: string): BehavioralCategory {
  return CATEGORY_TO_BEHAVIOR[category as BudgetCategory] || "Planned";
}
