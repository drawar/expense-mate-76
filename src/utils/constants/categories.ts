/**
 * ExpenseMate Category System
 *
 * This file defines the user-friendly behavioral categories for spending analysis.
 * Categories are organized into 6 main groups with subcategories.
 *
 * Key concepts:
 * - Parent Category: High-level grouping (Essentials, Lifestyle, etc.)
 * - Subcategory: Specific spending type (Groceries, Dining Out, etc.)
 * - MCC codes map to subcategories with confidence scores
 * - User can override categories; MCC is preserved for rewards
 */

// =============================================================================
// Category Configuration Types
// =============================================================================

export type BudgetPriority = "high" | "medium" | "low";
export type SavingsPotential = "high" | "medium" | "low";

export interface CategoryConfig {
  id: string;
  name: string;
  emoji: string;
  color: string;
  budgetPriority: BudgetPriority;
  savingsPotential: SavingsPotential;
  budgetPercentage: string; // e.g., "50-60%"
  description: string;
}

export interface SubcategoryConfig {
  id: string;
  name: string;
  parentCategory: string;
  emoji: string;
  description: string;
}

// =============================================================================
// Parent Categories (6 Main Groups)
// =============================================================================

export const PARENT_CATEGORIES: CategoryConfig[] = [
  {
    id: "essentials",
    name: "Essentials",
    emoji: "🏠",
    color: "#10b981", // Green
    budgetPriority: "high",
    savingsPotential: "low",
    budgetPercentage: "50-60%",
    description: "Fixed and necessary expenses for basic living",
  },
  {
    id: "lifestyle",
    name: "Lifestyle",
    emoji: "✨",
    color: "#8b5cf6", // Purple
    budgetPriority: "medium",
    savingsPotential: "high",
    budgetPercentage: "20-30%",
    description: "Discretionary spending on experiences and social activities",
  },
  {
    id: "home_living",
    name: "Home & Living",
    emoji: "🏡",
    color: "#f59e0b", // Amber
    budgetPriority: "medium",
    savingsPotential: "medium",
    budgetPercentage: "5-15%",
    description: "Maintaining and improving your living space",
  },
  {
    id: "personal_care",
    name: "Personal Care",
    emoji: "👤",
    color: "#ec4899", // Pink
    budgetPriority: "medium",
    savingsPotential: "medium",
    budgetPercentage: "3-8%",
    description: "Self-care, appearance, and clothing",
  },
  {
    id: "work_education",
    name: "Work & Education",
    emoji: "💼",
    color: "#3b82f6", // Blue
    budgetPriority: "high",
    savingsPotential: "low",
    budgetPercentage: "varies",
    description: "Career development and professional expenses",
  },
  {
    id: "financial_other",
    name: "Financial & Other",
    emoji: "💰",
    color: "#6b7280", // Gray
    budgetPriority: "medium",
    savingsPotential: "medium",
    budgetPercentage: "varies",
    description: "Financial services, subscriptions, and miscellaneous",
  },
];

// =============================================================================
// Subcategories
// =============================================================================

export const SUBCATEGORIES: SubcategoryConfig[] = [
  // Essentials
  {
    id: "groceries",
    name: "Groceries",
    parentCategory: "essentials",
    emoji: "🛒",
    description: "Food, beverages, produce, meat, dairy",
  },
  {
    id: "housing",
    name: "Housing",
    parentCategory: "essentials",
    emoji: "🏡",
    description: "Rent, mortgage, property taxes, home insurance",
  },
  {
    id: "utilities",
    name: "Utilities",
    parentCategory: "essentials",
    emoji: "💡",
    description: "Electricity, gas, water, internet, phone",
  },
  {
    id: "transportation",
    name: "Transportation",
    parentCategory: "essentials",
    emoji: "🚗",
    description: "Gas, public transit, parking, car insurance",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    parentCategory: "essentials",
    emoji: "💊",
    description: "Prescriptions, medical visits, dental, vision",
  },

  // Lifestyle
  {
    id: "dining_out",
    name: "Dining Out",
    parentCategory: "lifestyle",
    emoji: "🍽️",
    description: "Sit-down restaurants, cafes, bars",
  },
  {
    id: "fast_food",
    name: "Fast Food & Takeout",
    parentCategory: "lifestyle",
    emoji: "🍕",
    description: "Quick service, fast food chains, picked-up orders",
  },
  {
    id: "food_delivery",
    name: "Food Delivery",
    parentCategory: "lifestyle",
    emoji: "🚗",
    description: "Uber Eats, DoorDash, SkipTheDishes",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    parentCategory: "lifestyle",
    emoji: "🎬",
    description: "Movies, concerts, sports events, museums",
  },
  {
    id: "hobbies",
    name: "Hobbies & Recreation",
    parentCategory: "lifestyle",
    emoji: "🎨",
    description: "Craft supplies, sports equipment, gaming, books",
  },
  {
    id: "travel",
    name: "Travel & Vacation",
    parentCategory: "lifestyle",
    emoji: "✈️",
    description: "Flights, hotels, vacation expenses",
  },

  // Home & Living
  {
    id: "home_essentials",
    name: "Home Essentials",
    parentCategory: "home_living",
    emoji: "🧹",
    description: "Cleaning supplies, paper products, kitchen tools",
  },
  {
    id: "furniture",
    name: "Furniture & Decor",
    parentCategory: "home_living",
    emoji: "🛋️",
    description: "Furniture, bedding, curtains, decorative items",
  },
  {
    id: "home_improvement",
    name: "Home Improvement",
    parentCategory: "home_living",
    emoji: "🔨",
    description: "Tools, hardware, paint, garden care, appliances",
  },
  {
    id: "pet_care",
    name: "Pet Care",
    parentCategory: "home_living",
    emoji: "🐾",
    description: "Pet food, veterinary care, pet supplies",
  },

  // Personal Care
  {
    id: "clothing",
    name: "Clothing & Shoes",
    parentCategory: "personal_care",
    emoji: "👕",
    description: "Everyday clothing, work attire, shoes, accessories",
  },
  {
    id: "beauty",
    name: "Beauty & Personal Care",
    parentCategory: "personal_care",
    emoji: "💄",
    description: "Hair salon, cosmetics, skincare, spa services",
  },
  {
    id: "fitness",
    name: "Gym & Fitness",
    parentCategory: "personal_care",
    emoji: "💪",
    description: "Gym memberships, fitness classes, athletic wear",
  },

  // Work & Education
  {
    id: "professional_dev",
    name: "Professional Development",
    parentCategory: "work_education",
    emoji: "📚",
    description: "Courses, certifications, conference fees",
  },
  {
    id: "work_expenses",
    name: "Work Expenses",
    parentCategory: "work_education",
    emoji: "💼",
    description: "Work supplies, professional attire, business meals",
  },
  {
    id: "education",
    name: "Education",
    parentCategory: "work_education",
    emoji: "🎓",
    description: "Tuition, textbooks, school supplies",
  },

  // Financial & Other
  {
    id: "subscriptions",
    name: "Subscriptions & Memberships",
    parentCategory: "financial_other",
    emoji: "📱",
    description: "Streaming, software, cloud storage, memberships",
  },
  {
    id: "financial_services",
    name: "Financial Services",
    parentCategory: "financial_other",
    emoji: "🏦",
    description: "Bank fees, ATM fees, investment fees, tax prep",
  },
  {
    id: "insurance",
    name: "Insurance",
    parentCategory: "financial_other",
    emoji: "🛡️",
    description: "Life, disability, other non-health/auto/home",
  },
  {
    id: "gifts",
    name: "Gifts & Donations",
    parentCategory: "financial_other",
    emoji: "🎁",
    description: "Birthday/holiday gifts, charitable donations",
  },
  {
    id: "cash_atm",
    name: "Cash & ATM",
    parentCategory: "financial_other",
    emoji: "💵",
    description: "Cash withdrawals, money transfers",
  },
  {
    id: "fees",
    name: "Fees & Charges",
    parentCategory: "financial_other",
    emoji: "⚠️",
    description: "Late fees, overdraft fees, penalties",
  },
  {
    id: "uncategorized",
    name: "Uncategorized",
    parentCategory: "financial_other",
    emoji: "❓",
    description: "Transactions that need categorization",
  },
];

// =============================================================================
// Flat Category Lists (for backwards compatibility)
// =============================================================================

/**
 * All subcategory names as a flat array.
 * Used for dropdowns and validation.
 */
export const BUDGET_CATEGORIES = SUBCATEGORIES.map(
  (s) => s.name
) as readonly string[];

export type BudgetCategory = (typeof SUBCATEGORIES)[number]["name"];

/**
 * Parent category names
 */
export const PARENT_CATEGORY_NAMES = PARENT_CATEGORIES.map(
  (p) => p.name
) as readonly string[];

export type ParentCategory = (typeof PARENT_CATEGORIES)[number]["name"];

// =============================================================================
// Lookup Maps
// =============================================================================

/**
 * Map subcategory name to its config
 */
export const SUBCATEGORY_MAP: Record<string, SubcategoryConfig> =
  Object.fromEntries(SUBCATEGORIES.map((s) => [s.name, s]));

/**
 * Map parent category ID to its config
 */
export const PARENT_CATEGORY_MAP: Record<string, CategoryConfig> =
  Object.fromEntries(PARENT_CATEGORIES.map((p) => [p.id, p]));

/**
 * Map subcategory name to parent category config
 */
export const SUBCATEGORY_TO_PARENT: Record<string, CategoryConfig> =
  Object.fromEntries(
    SUBCATEGORIES.map((s) => [s.name, PARENT_CATEGORY_MAP[s.parentCategory]])
  );

/**
 * Get subcategories for a parent category
 */
export function getSubcategoriesForParent(
  parentId: string
): SubcategoryConfig[] {
  return SUBCATEGORIES.filter((s) => s.parentCategory === parentId);
}

/**
 * Get the parent category for a subcategory
 */
export function getParentCategory(
  subcategoryName: string
): CategoryConfig | undefined {
  return SUBCATEGORY_TO_PARENT[subcategoryName];
}

/**
 * Get the color for a category (subcategory inherits from parent)
 */
export function getCategoryColor(categoryName: string): string {
  const parent = getParentCategory(categoryName);
  return parent?.color || "#6b7280"; // Default gray
}

/**
 * Get the emoji for a category
 */
export function getCategoryEmoji(categoryName: string): string {
  const subcategory = SUBCATEGORY_MAP[categoryName];
  return subcategory?.emoji || "📦";
}

// =============================================================================
// Spending Tiers (Legacy Compatibility)
// =============================================================================

export const SPENDING_TIERS = ["Essentials", "Lifestyle", "Other"] as const;
export type SpendingTier = (typeof SPENDING_TIERS)[number];

/**
 * Maps subcategories to high-level spending tiers
 */
export const CATEGORY_TO_TIER: Record<string, SpendingTier> = {
  // Essentials
  Groceries: "Essentials",
  Housing: "Essentials",
  Utilities: "Essentials",
  Transportation: "Essentials",
  Healthcare: "Essentials",

  // Lifestyle
  "Dining Out": "Lifestyle",
  "Fast Food & Takeout": "Lifestyle",
  "Food Delivery": "Lifestyle",
  Entertainment: "Lifestyle",
  "Hobbies & Recreation": "Lifestyle",
  "Travel & Vacation": "Lifestyle",
  "Home Essentials": "Lifestyle",
  "Furniture & Decor": "Lifestyle",
  "Home Improvement": "Lifestyle",
  "Pet Care": "Lifestyle",
  "Clothing & Shoes": "Lifestyle",
  "Beauty & Personal Care": "Lifestyle",
  "Gym & Fitness": "Lifestyle",

  // Other
  "Professional Development": "Other",
  "Work Expenses": "Other",
  Education: "Other",
  "Subscriptions & Memberships": "Other",
  "Financial Services": "Other",
  Insurance: "Other",
  "Gifts & Donations": "Other",
  "Cash & ATM": "Other",
  "Fees & Charges": "Other",
  Uncategorized: "Other",

  // Legacy category mappings
  "Food & Drinks": "Lifestyle",
  Shopping: "Lifestyle",
  Travel: "Lifestyle",
  "Health & Personal Care": "Essentials",
  Services: "Other",
  Automotive: "Essentials",
  "Home & Rent": "Essentials",
  Government: "Other",
};

/**
 * Get the spending tier for a category
 */
export function getSpendingTier(category: string): SpendingTier {
  return CATEGORY_TO_TIER[category] || "Other";
}

// =============================================================================
// Behavioral Categories
// =============================================================================

export const BEHAVIORAL_CATEGORIES = [
  "Convenience",
  "Social",
  "Planned",
  "Investment",
] as const;

export type BehavioralCategory = (typeof BEHAVIORAL_CATEGORIES)[number];

export const CATEGORY_TO_BEHAVIOR: Record<string, BehavioralCategory> = {
  // Convenience (Lazy Money)
  "Food Delivery": "Convenience",
  "Fast Food & Takeout": "Convenience",
  "Subscriptions & Memberships": "Convenience",

  // Social spending
  "Dining Out": "Lifestyle",
  Entertainment: "Social",
  "Travel & Vacation": "Social",
  "Gifts & Donations": "Social",

  // Planned spending
  Groceries: "Planned",
  Housing: "Planned",
  Utilities: "Planned",
  Transportation: "Planned",
  "Home Essentials": "Planned",
  "Furniture & Decor": "Planned",
  "Home Improvement": "Planned",
  "Clothing & Shoes": "Planned",
  "Cash & ATM": "Planned",
  "Fees & Charges": "Planned",
  "Financial Services": "Planned",
  Insurance: "Planned",

  // Investment in self
  Healthcare: "Investment",
  "Beauty & Personal Care": "Investment",
  "Gym & Fitness": "Investment",
  "Professional Development": "Investment",
  "Work Expenses": "Investment",
  Education: "Investment",
  "Pet Care": "Investment",

  // Legacy mappings
  "Food & Drinks": "Convenience",
  Shopping: "Planned",
  Travel: "Social",
  "Health & Personal Care": "Investment",
  Services: "Planned",
  Automotive: "Planned",
  "Home & Rent": "Planned",
  Government: "Planned",
  Uncategorized: "Planned",
};

export function getBehavioralCategory(category: string): BehavioralCategory {
  return CATEGORY_TO_BEHAVIOR[category] || "Planned";
}

// =============================================================================
// Category Groups for UI Display
// =============================================================================

export interface CategoryGroup {
  parent: CategoryConfig;
  subcategories: SubcategoryConfig[];
}

/**
 * Get all categories grouped by parent for UI display
 */
export function getCategoryGroups(): CategoryGroup[] {
  return PARENT_CATEGORIES.map((parent) => ({
    parent,
    subcategories: getSubcategoriesForParent(parent.id),
  }));
}
