// utils/dashboard/constants.ts

/**
 * Japandi color palette for charts
 * Muted, natural tones that create visual hierarchy through value, not hue
 */
export const CHART_COLORS = [
  "#7c9885", // Sage green (primary - Essentials)
  "#a86f64", // Muted terracotta (Lifestyle)
  "#c4a57b", // Warm tan (Home & Living)
  "#9b8b7e", // Stone/taupe (Personal Care)
  "#6a8574", // Darker sage (Work & Education)
  "#6b6863", // Warm gray (Financial & Other)
  "#5d7567", // Deep sage
  "#b8997b", // Light tan
  "#8b7355", // Clay
];

/**
 * Define discretionary spending categories for savings analysis
 */
export const DISCRETIONARY_CATEGORIES = new Set(
  [
    "entertainment",
    "dining",
    "shopping",
    "leisure",
    "subscriptions",
    "travel",
    "hobbies",
    "gifts",
    "alcohol",
    "coffee",
    "electronics",
    "clothing",
    "beauty",
    "fast food",
    "food & drinks",
    "food and drinks",
    "home & entertainment",
    "restaurants",
  ].map((cat) => cat.toLowerCase())
);

/**
 * Constants for savings calculations to avoid magic numbers
 */
export const DISCRETIONARY_SAVINGS_RATE = 0.3; // 30% potential savings on discretionary spending
export const ESSENTIAL_SAVINGS_RATE = 0.05; // 5% potential savings on essential spending
export const TOP_CATEGORIES_COUNT = 3; // Number of top categories to return
export const MINIMUM_TRANSACTIONS_PER_CATEGORY = 3; // Minimum transactions needed for analysis
export const DEFAULT_REWARD_RATE = 1; // Assume standard 1x points for baseline comparison
export const SAVINGS_MULTIPLIER = 0.01; // Convert percentage to decimal (1% = 0.01)
