
export interface MerchantCategoryCode {
  code: string;
  description: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Merchant {
  id: string;
  name: string;
  address?: string;
  coordinates?: Coordinates;
  mcc?: MerchantCategoryCode;
  isOnline?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'credit_card';
  currency: Currency;
  rewardRules: RewardRule[];
  statementStartDay?: number;
  isMonthlyStatement?: boolean;
  active: boolean;
  lastFourDigits?: string;
  issuer?: string;
  icon?: string;
  color?: string;
  imageUrl?: string;
  conversionRate?: Record<Currency, number>;
  selectedCategories?: string[];
}

export type Currency = 'SGD' | 'USD' | 'EUR' | 'GBP' | string;

export interface Transaction {
  id: string;
  amount: number;
  currency: Currency;
  merchant: Merchant;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  paymentCurrency: Currency;
  date: string; // Using string format for dates
  category?: string;
  notes?: string;
  isContactless: boolean;
  rewardPoints?: number;
  basePoints?: number;
  bonusPoints?: number;
  reimbursementAmount?: number;
  is_deleted?: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
  checked: boolean;
}

// Import and re-export RewardRule and related types
import type { 
  RewardRule,
  RuleCondition,
  CalculationMethod,
  RoundingStrategy,
  SpendingPeriodType,
  BonusTier,
  CalculationInput,
  CalculationResult,
  TransactionType
} from '@/core/rewards/types';

// Re-export the types
export type {
  RewardRule,
  RuleCondition,
  CalculationMethod,
  RoundingStrategy,
  SpendingPeriodType,
  BonusTier,
  CalculationInput,
  CalculationResult,
  TransactionType
};
