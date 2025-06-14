
import { Database } from '@/types/supabase';

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
  isContactless: boolean;
  notes?: string;
  reimbursementAmount?: number;
  category?: string;
  is_deleted?: boolean;
};

export type PaymentMethodType = 'credit_card' | 'debit_card' | 'cash' | 'bank_account' | 'other';
// Updated Currency type to match what's actually implemented in CurrencyService
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CNY' | 'INR' | 'SGD' | 'TWD' | 'VND' | 'IDR' | 'THB' | 'MYR';

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
  active: boolean;
  rewardRules?: any[];
  conversionRate?: Record<string, number>;
  selectedCategories?: string[];
  statementStartDay?: number;
  isMonthlyStatement?: boolean;
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

export type CalculationResult = {
  totalPoints: number;
  basePoints: number;
  bonusPoints: number;
  pointsCurrency: string;
  remainingMonthlyBonusPoints?: number;
  minSpendMet: boolean;
  appliedRule?: any;
  appliedTier?: any;
  messages: string[];
};

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
  active: boolean;
  reward_rules: any | null;
  selected_categories: any | null;
  statement_start_day: number | null;
  is_monthly_statement: boolean | null;
  conversion_rate: any | null;
  created_at: string;
  updated_at: string;
}

export interface DbMerchant {
  id: string;
  name: string;
  address: string | null;
  mcc: any | null;
  is_online: boolean | null;
  coordinates: any | null;
  is_deleted?: boolean;
  created_at: string;
  updated_at?: string;
}
