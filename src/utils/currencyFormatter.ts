
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
  TWD: 'NT$',
  SGD: 'S$',
  VND: '₫',
  IDR: 'Rp',
  THB: '฿',
  MYR: 'RM',
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  // Added debug log to check currency formatting
  console.log(`Formatting currency: ${amount} ${currency}`);
  
  // Handle edge cases where currency might be undefined or invalid
  if (!currency || !Object.keys(currencySymbols).includes(currency)) {
    console.warn(`Invalid currency provided: ${currency}, using USD as fallback`);
    currency = 'USD' as Currency;
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: ['JPY', 'VND', 'IDR', 'TWD'].includes(currency) ? 0 : 2,
    maximumFractionDigits: ['JPY', 'VND', 'IDR', 'TWD'].includes(currency) ? 0 : 2,
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
  { value: 'TWD', label: 'TWD - New Taiwan Dollar (NT$)' },
  { value: 'SGD', label: 'SGD - Singapore Dollar (S$)' },
  { value: 'VND', label: 'VND - Vietnamese Dong (₫)' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah (Rp)' },
  { value: 'THB', label: 'THB - Thai Baht (฿)' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit (RM)' },
];
