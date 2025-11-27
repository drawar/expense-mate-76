export interface RewardRule {
  id: string;
  cardTypeId: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  reward: RewardConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  type:
    | "mcc"
    | "transaction_type"
    | "currency"
    | "merchant"
    | "amount"
    | "compound"
    | "category";
  operation:
    | "include"
    | "exclude"
    | "equals"
    | "greater_than"
    | "less_than"
    | "range"
    | "any"
    | "all";
  values: (string | number)[];
  displayName?: string;
  subConditions?: RuleCondition[];
}

export interface RewardConfig {
  calculationMethod: "standard" | "tiered" | "flat_rate" | "direct";
  baseMultiplier: number;
  bonusMultiplier: number;
  pointsRoundingStrategy: "floor" | "ceiling" | "nearest";
  amountRoundingStrategy: "floor" | "ceiling" | "nearest" | "floor5" | "none";
  blockSize: number;
  bonusTiers: BonusTier[];
  monthlyCap?: number;
  monthlyMinSpend?: number;
  monthlySpendPeriodType?: "calendar" | "statement" | "statement_month";
  pointsCurrency: string;
}

export interface BonusTier {
  minAmount?: number;
  maxAmount?: number;
  minSpend?: number;
  maxSpend?: number;
  multiplier: number;
  description?: string;
  name?: string;
  priority?: number;
  condition?: RuleCondition;
}

export interface PaymentMethodInput {
  id?: string;
  issuer: string;
  name: string;
  pointsCurrency?: string;
}

export interface CalculationInput {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodInput;
  mcc?: string;
  merchantName?: string;
  transactionType: TransactionType;
  isOnline?: boolean;
  isContactless?: boolean;
  date: Date | { toJSDate: () => Date }; // DateTime from luxon or Date
  monthlySpend?: number;
  usedBonusPoints?: number;
}

export interface CalculationResult {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  pointsCurrency: string;
  remainingMonthlyBonusPoints?: number;
  minSpendMet: boolean;
  appliedRule?: RewardRule;
  appliedTier?: BonusTier;
  messages: string[];
}

export type TransactionType =
  | "purchase"
  | "refund"
  | "adjustment"
  | "online"
  | "contactless"
  | "in_store";

// Constant values for transaction types
export const TransactionTypeValues = {
  purchase: "purchase" as const,
  refund: "refund" as const,
  adjustment: "adjustment" as const,
  online: "online" as const,
  contactless: "contactless" as const,
  in_store: "in_store" as const,
} as const;

export interface CardType {
  id: string;
  name: string;
  issuer: string;
  pointsCurrency?: string;
  rewardRules: RewardRule[];
  defaultRules?: RewardRule[];
  hasCategories?: boolean;
  availableCategories?: string[];
  maxCategoriesSelectable?: number;
}

/**
 * Database representation of a reward rule
 * Maps to the reward_rules table in Supabase
 * All fields match the database column names (snake_case)
 */
export interface DbRewardRule {
  id: string;
  card_type_id: string;
  name: string;
  description: string | null;
  enabled: boolean | null;
  priority: number | null;
  conditions: string | RuleCondition[] | null;
  bonus_tiers: string | BonusTier[] | null;
  calculation_method: string | null;
  base_multiplier: number | null;
  bonus_multiplier: number | null;
  points_rounding_strategy: string | null;
  amount_rounding_strategy: string | null;
  block_size: number | null;
  monthly_cap: number | null;
  monthly_min_spend: number | null;
  monthly_spend_period_type: string | null;
  points_currency: string | null;
  // Legacy fields (kept for backward compatibility)
  monthly_bonus_cap?: number | null;
  min_spend?: number | null;
  max_bonus_per_transaction?: number | null;
  qualifying_period_days?: number | null;
  excluded_categories?: string[] | null;
  included_categories?: string[] | null;
  excluded_merchants?: string[] | null;
  included_merchants?: string[] | null;
  created_at: string;
  updated_at: string | null;
}

export type SpendingPeriodType = "calendar" | "statement" | "statement_month";

// Add missing CalculationMethod type alias
export type CalculationMethod = "standard" | "tiered" | "flat_rate" | "direct";
