
import { Currency } from '@/types';

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CNY: '¥',
  INR: '₹',
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  });
  
  return formatter.format(amount);
};

export const getCurrencySymbol = (currency: Currency): string => {
  return currencySymbols[currency] || currency;
};

export const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD - US Dollar ($)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'GBP', label: 'GBP - British Pound (£)' },
  { value: 'JPY', label: 'JPY - Japanese Yen (¥)' },
  { value: 'AUD', label: 'AUD - Australian Dollar (A$)' },
  { value: 'CAD', label: 'CAD - Canadian Dollar (C$)' },
  { value: 'CNY', label: 'CNY - Chinese Yuan (¥)' },
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
];
