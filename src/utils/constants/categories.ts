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
