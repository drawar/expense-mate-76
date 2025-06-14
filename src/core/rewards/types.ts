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
  type: 'mcc' | 'transaction_type' | 'currency' | 'merchant' | 'amount';
  operation: 'include' | 'exclude' | 'equals' | 'greater_than' | 'less_than' | 'range';
  values: (string | number)[];
  displayName?: string;
}

export interface RewardConfig {
  calculationMethod: 'standard' | 'tiered' | 'flat_rate';
  baseMultiplier: number;
  bonusMultiplier: number;
  pointsRoundingStrategy: 'floor' | 'ceiling' | 'nearest';
  amountRoundingStrategy: 'floor' | 'ceiling' | 'nearest' | 'floor5';
  blockSize: number;
  bonusTiers: BonusTier[];
  monthlyCap?: number;
  monthlyMinSpend?: number;
  monthlySpendPeriodType?: 'calendar' | 'statement';
  pointsCurrency: string;
}

export interface BonusTier {
  minAmount?: number;
  maxAmount?: number;
  multiplier: number;
  description?: string;
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

export type TransactionType = 'purchase' | 'refund' | 'adjustment';

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
