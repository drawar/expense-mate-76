// services/rewards/types.ts

import { PaymentMethod } from "@/types";

/**
 * Transaction type enum (mutually exclusive types)
 */
export enum TransactionType {
  ONLINE = 'online',
  CONTACTLESS = 'contactless',
  IN_STORE = 'in_store' // Neither online nor contactless
}

/**
 * Condition types supported by the rule engine
 */
export type ConditionType = 
  | 'mcc' 
  | 'merchant' 
  | 'transaction_type' // For online/contactless/in_store
  | 'currency'
  | 'amount'
  | 'date'
  | 'category'
  | 'spend_threshold' // For minimum monthly spend
  | 'compound';

/**
 * Condition interface - defines what makes a transaction eligible for a rule
 */
export interface RuleCondition {
  type: ConditionType;
  operation: 'include' | 'exclude' | 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'between' | 'any' | 'all';
  values?: string[] | number[] | boolean[] | TransactionType[];
  subConditions?: RuleCondition[]; // For compound conditions (AND/OR)
  field?: string; // For dynamic field conditions
}

/**
 * Reward calculation method
 */
export type CalculationMethod = 
  | 'standard'      // Amount is rounded first, then divided by blockSize, then multiplied by rate
  | 'direct';       // Amount is multiplied by rate first, then rounded

/**
 * Rounding strategy for amount and points
 */
export type RoundingStrategy = 
  | 'floor'     // Round down
  | 'ceiling'   // Round up
  | 'nearest'   // Round to nearest
  | 'floor5'    // Round down to nearest $5
  | 'none';     // No rounding

/**
 * Period type for minimum spend threshold
 */
export type SpendingPeriodType = 
  | 'statement_month'  // Based on card's statement cycle
  | 'calendar_month';  // Based on calendar month

/**
 * Bonus tier definition
 */
export interface BonusTier {
  name: string;
  multiplier: number;
  priority: number;
  // Modify the condition to support compound conditions
  condition: RuleCondition | {
    type: 'compound',
    operation: 'any' | 'all', // 'any' for OR logic, 'all' for AND logic
    subConditions: RuleCondition[]
  };
}

/**
 * Reward definition - defines how points are calculated
 */
export interface RuleReward {
  calculationMethod: CalculationMethod;
  baseMultiplier: number // Default base multiplier
  bonusMultiplier: number; // Default bonus multiplier
  pointsRoundingStrategy: RoundingStrategy; // How to round the calculated points
  amountRoundingStrategy: RoundingStrategy; // How to round the amount before calculation
  blockSize: number; // Amount per point block (usually 1 or 5)
  bonusTiers?: BonusTier[]; // Multiple bonus tiers with different multipliers
  monthlyCap?: number; // Maximum bonus points per month (shared across all tiers)
  monthlyMinSpend?: number; // Minimum spend required to activate bonus rate
  monthlySpendPeriodType?: SpendingPeriodType; // Whether minimum spend is per statement or calendar month
  pointsCurrency: string; // What kind of points this earns
}

/**
 * Complete rule definition
 */
export interface RewardRule {
  id: string;
  cardTypeId: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // Higher priority rules are applied first
  conditions: RuleCondition[];
  reward: RuleReward;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for rule engine calculation
 */
export interface CalculationInput {
  amount: number;
  currency: string;
  mcc?: string;
  merchantName?: string;
  transactionType: TransactionType; // Updated to use enum
  usedBonusPoints?: number;
  monthlySpend?: number; // Total eligible spend this month for threshold calculation
  paymentMethod: PaymentMethod;
  date: Date;
  category?: string;
  statementDay?: number; // Day of month when statement cycle starts
  [key: string]: any; // For extensibility
}

/**
 * Result of rule engine calculation
 */
export interface CalculationResult {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  pointsCurrency: string;
  remainingMonthlyBonusPoints?: number;
  minSpendMet: boolean; // Whether minimum spend threshold was met
  appliedRule?: RewardRule; // The rule that was applied
  appliedTier?: BonusTier; // The bonus tier that was applied (if any)
  messages: string[];
}

/**
 * Card type definition
 */
export interface CardType {
  id: string;
  issuer: string;
  name: string;
  defaultRules: RewardRule[];
  pointsCurrency: string;
  hasCategories?: boolean;
  availableCategories?: string[];
  maxCategoriesSelectable?: number;
  statementDay?: number; // Default statement cycle start day (1-31)
}
