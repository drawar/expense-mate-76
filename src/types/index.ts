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
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'SEK' | 'NZD' | 'MXN' | 'SGD' | 'HKD' | 'NOK' | 'KRW' | 'TRY' | 'RUB' | 'INR' | 'BRL' | 'ZAR';

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
