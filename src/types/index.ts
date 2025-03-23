export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CNY' | 'INR' | 'NTD' | 'SGD' | 'VND' | 'IDR' | 'THB' | 'MYR';

export type MerchantCategoryCode = {
  code: string;
  description: string;
};

export type PaymentMethodType = 'cash' | 'credit_card';

export interface RewardRule {
  id: string;
  name: string;
  description: string;
  type: 'mcc' | 'merchant' | 'currency' | 'spend_threshold';
  condition: string | string[]; // MCC code, merchant name, currency, or threshold
  pointsMultiplier: number;
  minSpend?: number;
  maxSpend?: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  currency: Currency;
  rewardRules: RewardRule[];
  statementStartDay?: number; // 1-31, day of month when statement begins
  isMonthlyStatement?: boolean; // true = statement month, false = calendar month
  active: boolean;
  lastFourDigits?: string; // For credit cards
  issuer?: string; // For credit cards
  icon?: string; // Icon identifier
  color?: string; // Color for the card
  conversionRate?: Record<Currency, number>; // Exchange rates for currency conversion
}

export interface Merchant {
  id: string;
  name: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  mcc?: MerchantCategoryCode;
  isOnline: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  merchant: Merchant;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  paymentCurrency: Currency;
  rewardPoints: number;
  notes?: string;
  category?: string;
  tags?: string[];
  isContactless?: boolean;
}

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  byCurrency: Record<Currency, number>;
  rewardPointsEarned: number;
}
