
import { Transaction, PaymentMethod } from '@/types';

export type FilterOptions = {
  merchantName: string;
  paymentMethodId: string;
  currency: string;
  startDate: string;
  endDate: string;
};

export type FilterOption = {
  key: keyof FilterOptions;
  label: string;
  options?: { value: string; label: string }[];
};

export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
