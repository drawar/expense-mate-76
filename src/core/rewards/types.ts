export interface RewardRule {
  id: string;
  /** @deprecated Use cardCatalogId instead. Kept for backward compatibility with existing rules. */
  cardTypeId: string;
  /** UUID foreign key to card_catalog. Preferred over cardTypeId for rule matching. */
  cardCatalogId?: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  reward: RewardConfig;
  /** Optional start date for time-limited/promotional rules */
  validFrom?: Date;
  /** Optional end date for time-limited/promotional rules */
  validUntil?: Date;
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
  /**
   * Calculation method for rewards:
   * - "standard": base and bonus calculated separately, then added
   * - "total_first": total calculated first using (baseMultiplier + bonusMultiplier),
   *                  then bonus derived as total - base. Used for Amex Canada cards.
   * - "tiered": uses bonus tiers based on spending thresholds
   * - "flat_rate": fixed points regardless of amount
   * - "direct": points equal to amount (1:1)
   */
  calculationMethod:
    | "standard"
    | "total_first"
    | "tiered"
    | "flat_rate"
    | "direct";
  baseMultiplier: number;
  bonusMultiplier: number;
  pointsRoundingStrategy: "floor" | "ceiling" | "nearest";
  amountRoundingStrategy: "floor" | "ceiling" | "nearest" | "floor5" | "none";
  blockSize: number;
  bonusTiers: BonusTier[];
  monthlyCap?: number;
  /** What the monthly cap refers to: "bonus_points" (default) or "spend_amount" */
  monthlyCapType?: "bonus_points" | "spend_amount";
  monthlyMinSpend?: number;
  monthlySpendPeriodType?:
    | "calendar"
    | "statement"
    | "statement_month"
    | "promotional";
  /**
   * @deprecated Points currency is no longer stored per rule.
   * Use PaymentMethod.pointsCurrency instead.
   * This field is kept for backwards compatibility but ignored in new rules.
   */
  pointsCurrency?: string;
  /** Optional cap group ID for sharing monthly cap across multiple rules */
  capGroupId?: string;
  /**
   * For promotional caps: when the cap tracking period starts.
   * All transactions from this date until validUntil accumulate toward the same cap.
   * Distinct from RewardRule.validFrom which controls when the rule is active.
   */
  promoStartDate?: Date;
  /**
   * Compound bonus multipliers for rules that combine multiple bonus rates.
   * Each multiplier is calculated and rounded separately, then summed.
   * Example: [1.5, 2.5] for a $25 transaction = round(25*1.5) + round(25*2.5) = 38 + 63 = 101
   * Use this instead of bonusMultiplier when you need separate rounding for each component.
   */
  compoundBonusMultipliers?: number[];
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
  /** Card catalog UUID for rule matching via card_catalog_id */
  cardCatalogId?: string;
}

/**
 * Input for reward calculation.
 *
 * CRITICAL: When transaction currency differs from payment currency,
 * `convertedAmount` MUST be provided and will be used for points calculation.
 * Points are ALWAYS calculated on the payment currency amount, NOT the transaction amount.
 *
 * Example: A $100 USD transaction on a SGD card converts to $135 SGD.
 * - amount = 100 (transaction amount in USD)
 * - currency = "USD" (transaction currency)
 * - convertedAmount = 135 (amount in payment/card currency - USE THIS FOR POINTS)
 * - convertedCurrency = "SGD" (payment method currency)
 * - Points calculated on $135 SGD, NOT $100 USD
 */
export interface CalculationInput {
  /** Original transaction amount (in transaction currency) */
  amount: number;
  /** Transaction currency (e.g., "USD" for a foreign purchase) */
  currency: string;
  /**
   * Amount in payment method currency (when different from transaction currency).
   * CRITICAL: When present, this is the amount used for points calculation.
   * Points are calculated on the card/statement currency, NOT the transaction currency.
   */
  convertedAmount?: number;
  /** Payment method currency (e.g., "SGD" for a Singapore card) */
  convertedCurrency?: string;
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
  appliedRuleId?: string;
  appliedTier?: BonusTier;
  monthlyCap?: number;
  periodType?: SpendingPeriodType;
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
  /** @deprecated Use card_catalog_id instead. Kept for backward compatibility with existing rules. */
  card_type_id: string;
  /** UUID foreign key to card_catalog. Preferred over card_type_id for rule matching. */
  card_catalog_id: string | null;
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
  monthly_cap_type: string | null;
  monthly_min_spend: number | null;
  monthly_spend_period_type: string | null;
  cap_group_id: string | null;
  /** Optional start date for time-limited/promotional rules (ISO string) */
  valid_from: string | null;
  /** Optional end date for time-limited/promotional rules (ISO string) */
  valid_until: string | null;
  /** For promotional caps: when the cap tracking period starts (ISO date string) */
  promo_start_date: string | null;
  /** Compound bonus multipliers as JSON array */
  compound_bonus_multipliers: number[] | null;
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

export type SpendingPeriodType =
  | "calendar"
  | "statement"
  | "statement_month"
  | "promotional";

// Add missing CalculationMethod type alias
export type CalculationMethod =
  | "standard"
  | "total_first"
  | "tiered"
  | "flat_rate"
  | "direct";
