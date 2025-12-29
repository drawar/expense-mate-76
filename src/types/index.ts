import { Database } from "@/types/supabase";

export type Transaction = {
  id: string;
  date: string;
  merchant: Merchant;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  paymentCurrency: Currency;
  rewardPoints: number;
  basePoints: number;
  bonusPoints: number;
  promoBonusPoints?: number; // One-time promotional bonus points not from regular reward rules
  isContactless: boolean;
  notes?: string;
  reimbursementAmount?: number;

  // MCC snapshot (immutable, for rewards calculation)
  mccCode?: string;

  // User category (editable, for budgets/spending analysis)
  userCategory?: string;
  isRecategorized?: boolean;

  // Auto-categorization metadata
  autoCategoryConfidence?: number; // 0.0 to 1.0 confidence score
  needsReview?: boolean; // Flag for transactions needing user review
  categorySuggestionReason?: string; // Why this category was suggested

  // Legacy field (synced with userCategory for backwards compatibility)
  category?: string;

  is_deleted?: boolean;
  deleted_at?: string;
};

export type PaymentMethodType =
  | "credit_card"
  | "debit_card"
  | "prepaid_card"
  | "cash"
  | "bank_account"
  | "other";
// Updated Currency type to match what's actually implemented in CurrencyService
export type Currency =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "CAD"
  | "AUD"
  | "CNY"
  | "INR"
  | "SGD"
  | "TWD"
  | "VND"
  | "IDR"
  | "THB"
  | "MYR";

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  issuer: string;
  lastFourDigits?: string;
  currency: Currency;
  icon?: string;
  color?: string;
  imageUrl?: string;
  pointsCurrency?: string;
  rewardCurrencyId?: string;
  active: boolean;
  rewardRules?: unknown[];
  conversionRate?: Record<string, number>;
  selectedCategories?: string[];
  statementStartDay?: number;
  isMonthlyStatement?: boolean;
  totalLoaded?: number; // For prepaid cards: total amount loaded onto the card

  // Card Catalog linkage
  /** Reference to card_catalog for inherited properties. Null for custom cards. */
  cardCatalogId?: string;
  /** User's custom display name for the card (e.g., "My Travel Card") */
  nickname?: string;
}

export interface Merchant {
  id: string;
  name: string;
  address?: string;
  mcc?: MerchantCategoryCode;
  isOnline: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
  is_deleted?: boolean;
  created_at?: string;
  deleted_at?: string;
}

export interface MerchantCategoryCode {
  code: string;
  description: string;
}

// Re-export CalculationResult from core rewards module
export type { CalculationResult } from "@/core/rewards/types";

// Database types for Supabase
export interface DbPaymentMethod {
  id: string;
  name: string;
  type: string;
  issuer: string | null;
  last_four_digits: string | null;
  currency: string;
  icon: string | null;
  color: string | null;
  image_url: string | null;
  points_currency: string | null;
  reward_currency_id: string | null;
  is_active: boolean | null;
  reward_rules: unknown | null;
  selected_categories: string[] | null;
  statement_start_day: number | null;
  is_monthly_statement: boolean | null;
  conversion_rate: Record<string, number> | null;
  total_loaded: number | null; // For prepaid cards: total amount loaded onto the card
  created_at: string;
  updated_at: string;
}

export interface DbMerchant {
  id: string;
  name: string;
  address: string | null;
  mcc: { code: string; description: string } | null; // Legacy JSONB column
  mcc_code: string | null; // New normalized column (references mcc table)
  is_online: boolean | null;
  coordinates: { lat: number; lng: number } | null;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
}

// =============================================================================
// Insight Types
// =============================================================================

export type InsightCategory =
  | "spending"
  | "budget"
  | "savings"
  | "behavior"
  | "optimization"
  | "milestone"
  | "warning";

export type InsightSeverity = "info" | "success" | "warning" | "danger";

export type InsightConditionType =
  | "category_ratio"
  | "category_amount"
  | "category_comparison"
  | "tier_ratio"
  | "spending_trend"
  | "budget_status"
  | "transaction_pattern"
  | "merchant_pattern"
  | "merchant_anomaly"
  | "reward_optimization"
  | "savings_rate"
  | "milestone"
  | "time_based";

export type InsightActionType = "link" | "modal" | "none";

/**
 * Insight template from the database
 */
export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;
  messageTemplate: string;
  icon?: string;
  severity: InsightSeverity;
  conditionType: InsightConditionType;
  conditionParams: Record<string, unknown>;
  actionText?: string;
  actionType?: InsightActionType;
  actionTarget?: string;
  priority: number;
  isActive: boolean;
  isDismissible: boolean;
  cooldownDays?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Database row type for insights
 */
export interface DbInsight {
  id: string;
  category: string;
  title: string;
  message_template: string;
  icon: string | null;
  severity: string;
  condition_type: string;
  condition_params: Record<string, unknown>;
  action_text: string | null;
  action_type: string | null;
  action_target: string | null;
  priority: number;
  is_active: boolean;
  is_dismissible: boolean;
  cooldown_days: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * A rendered insight with template values filled in
 */
export interface RenderedInsight {
  id: string;
  insightId: string;
  category: InsightCategory;
  title: string;
  message: string; // Template with values filled in
  icon?: string;
  severity: InsightSeverity;
  actionText?: string;
  actionType?: InsightActionType;
  actionTarget?: string;
  priority: number;
  isDismissible: boolean;
  dismissedAt?: string;
}

/**
 * User insight dismissal tracking
 */
export interface UserInsightDismissal {
  id: string;
  userId: string;
  insightId: string;
  dismissedAt: string;
}
