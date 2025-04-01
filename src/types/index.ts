
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CNY' | 'INR' | 'TWD' | 'SGD' | 'VND' | 'IDR' | 'THB' | 'MYR';

export type MerchantCategoryCode = {
  code: string;
  description: string;
};

export type PaymentMethodType = 'cash' | 'credit_card';

export interface RewardRule {
  id: string;
  name: string;
  description: string;
  type: 'mcc' | 'merchant' | 'currency' | 'spend_threshold' | 'online' | 'contactless' | 'generic';
  condition: string | string[]; // MCC code, merchant name, currency, threshold, or special conditions
  pointsMultiplier: number;
  minSpend?: number;
  maxSpend?: number;
  pointsCurrency?: string; // Added this property to fix the TypeScript error
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
  imageUrl?: string; // URL to custom card image
  conversionRate?: Record<Currency, number>; // Exchange rates for currency conversion
  selectedCategories?: string[]; // Selected categories for category-based cards like UOB Lady's
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
  basePoints?: number; 
  notes?: string;
  category?: string;
  tags?: string[];
  isContactless?: boolean;
  is_deleted?: boolean; // Add this field to match the backend schema
  reimbursementAmount?: number; // Add reimbursement amount to track expense reimbursements
}

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: Record<string, number>;
  byPaymentMethod: Record<string, number>;
  byCurrency: Record<Currency, number>;
  rewardPointsEarned: number;
}
