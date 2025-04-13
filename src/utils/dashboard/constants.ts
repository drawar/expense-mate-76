// utils/dashboard/constants.ts

/**
 * Standard color palette for charts
 */
export const CHART_COLORS = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#6366F1", // indigo
    "#EF4444", // red
    "#14B8A6", // teal
    "#F97316", // orange
  ];
  
  /**
   * Define discretionary spending categories for savings analysis
   */
  export const DISCRETIONARY_CATEGORIES = new Set([
    'entertainment', 'dining', 'shopping', 'leisure',
    'subscriptions', 'travel', 'hobbies', 'gifts',
    'alcohol', 'coffee', 'electronics', 'clothing',
    'beauty', 'fast food', 'food & drinks', 'food and drinks',
    'home & entertainment', 'restaurants'
  ].map(cat => cat.toLowerCase()));
  
  /**
   * Constants for savings calculations to avoid magic numbers
   */
  export const DISCRETIONARY_SAVINGS_RATE = 0.3; // 30% potential savings on discretionary spending
  export const ESSENTIAL_SAVINGS_RATE = 0.05;    // 5% potential savings on essential spending
  export const TOP_CATEGORIES_COUNT = 3;         // Number of top categories to return
  export const MINIMUM_TRANSACTIONS_PER_CATEGORY = 3; // Minimum transactions needed for analysis
  export const DEFAULT_REWARD_RATE = 1; // Assume standard 1x points for baseline comparison
  export const SAVINGS_MULTIPLIER = 0.01; // Convert percentage to decimal (1% = 0.01)
