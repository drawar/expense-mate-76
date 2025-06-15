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
  type: 'mcc' | 'transaction_type' | 'currency' | 'merchant' | 'amount' | 'compound' | 'category';
  operation: 'include' | 'exclude' | 'equals' | 'greater_than' | 'less_than' | 'range' | 'any' | 'all';
  values: (string | number)[];
  displayName?: string;
  subConditions?: RuleCondition[];
}

export interface RewardConfig {
  calculationMethod: 'standard' | 'tiered' | 'flat_rate' | 'direct';
  baseMultiplier: number;
  bonusMultiplier: number;
  pointsRoundingStrategy: 'floor' | 'ceiling' | 'nearest';
  amountRoundingStrategy: 'floor' | 'ceiling' | 'nearest' | 'floor5' | 'none';
  blockSize: number;
  bonusTiers: BonusTier[];
  monthlyCap?: number;
  monthlyMinSpend?: number;
  monthlySpendPeriodType?: 'calendar' | 'statement' | 'statement_month';
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

export interface CalculationInput {
  amount: number;
  currency: string;
  paymentMethod: any;
  mcc?: string;
  merchantName?: string;
  transactionType: TransactionType;
  isOnline?: boolean;
  isContactless?: boolean;
  date: any; // DateTime from luxon
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

export type TransactionType = 'purchase' | 'refund' | 'adjustment' | 'online' | 'contactless' | 'in_store';

// Constant values for transaction types
export const TransactionTypeValues = {
  purchase: 'purchase' as const,
  refund: 'refund' as const,
  adjustment: 'adjustment' as const,
  online: 'online' as const,
  contactless: 'contactless' as const,
  in_store: 'in_store' as const,
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

export interface DbRewardRule {
  id: string;
  card_type_id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority?: number;
  conditions: string | RuleCondition[];
  bonus_tiers: string | BonusTier[];
  calculation_method: string;
  base_multiplier: number;
  bonus_multiplier: number;
  points_rounding_strategy: string;
  amount_rounding_strategy: string;
  block_size: number;
  monthly_cap?: number;
  monthly_min_spend?: number;
  monthly_spend_period_type?: string;
  points_currency?: string;
  created_at: string;
  updated_at?: string;
}

export type SpendingPeriodType = 'calendar' | 'statement' | 'statement_month';

// Add missing CalculationMethod type alias
export type CalculationMethod = 'standard' | 'tiered' | 'flat_rate' | 'direct';
