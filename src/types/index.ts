
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
  date: string; // Changed from Date to string for compatibility
  category?: string;
  notes?: string;
  isContactless: boolean;
  rewardPoints?: number;
  basePoints?: number;
  bonusPoints?: number;
  reimbursementAmount?: number; // Added missing property
  is_deleted?: boolean; // Added missing property
}

export interface FilterOption {
  label: string;
  value: string;
  checked: boolean;
}

// Export RewardRule from services/rewards/types to make it accessible through @/types
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
} from '@/services/rewards/types';
