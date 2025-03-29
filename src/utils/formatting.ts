// src/utils/formatting.ts
import { Currency } from '@/types';

/**
 * Currency symbols mapping
 */
const currencySymbols: Record<Currency, string> = {
  USD: ''
,
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A'
,
  CAD: 'C'
,
  CNY: '¥',
  INR: '₹',
  TWD: 'NT'
,
  SGD: 'S'
,
  VND: '₫',
  IDR: 'Rp',
  THB: '฿',
  MYR: 'RM',
};

/**
 * List of currencies that don't use decimal places
 */
const noDecimalCurrencies = ['JPY', 'VND', 'IDR', 'TWD'];

/**
 * Formats a number with thousands separators
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Gets the currency symbol for a given currency code
 */
export const getCurrencySymbol = (currency: Currency): string => {
  return currencySymbols[currency] || currency;
};

/**
 * Formats currency with the appropriate symbol and formatting rules
 * - Uses 0 decimal places for JPY, VND, IDR, TWD
 * - Uses 2 decimal places for all other currencies
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  // Handle edge cases where currency might be undefined or invalid
  if (!currency || !Object.keys(currencySymbols).includes(currency)) {
    console.warn(`Invalid currency provided: ${currency}, using USD as fallback`);
    currency = 'USD' as Currency;
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: noDecimalCurrencies.includes(currency) ? 0 : 2,
    maximumFractionDigits: noDecimalCurrencies.includes(currency) ? 0 : 2,
  });
  
  return formatter.format(amount);
};

/**
 * Available currency options for dropdowns
 */
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

/**
 * Formats a percentage value with appropriate sign and decimal places
 */
export const formatPercentage = (value: number, showSign: boolean = false, decimalPlaces: number = 1): string => {
  const formattedValue = value.toFixed(decimalPlaces);
  const prefix = showSign && value > 0 ? '+' : '';
  return `${prefix}${formattedValue}%`;
};

/**
 * Determines if an expense percentage change is positive (bad) or negative (good)
 * For expenses, an increase is bad (positive = true), a decrease is good (positive = false)
 */
export const isExpenseChangePositive = (percentageChange: number): boolean => {
  return percentageChange >= 0;
};

/**
 * Gets the appropriate color class for an expense trend
 */
export const getExpenseTrendColor = (percentageChange: number): string => {
  const isPositive = isExpenseChangePositive(percentageChange);
  return isPositive 
    ? "text-red-500 dark:text-red-400" 
    : "text-green-500 dark:text-green-400";
};
