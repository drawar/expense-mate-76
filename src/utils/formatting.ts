// src/utils/formatting.ts
import { Currency } from '@/types';

/**
 * List of currencies that don't use decimal places
 */
const NO_DECIMAL_CURRENCIES = ['JPY', 'VND', 'IDR', 'TWD'];

/**
 * Currency symbols mapping
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
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

/**
 * Formats a number with thousands separators
 * @param value Number to format
 * @returns Formatted string with thousands separators
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString();
};

/**
 * Gets the currency symbol for a given currency code
 * @param currency Currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: Currency): string => {
  return CURRENCY_SYMBOLS[currency] || currency;
};

/**
 * Formats currency with the appropriate symbol and formatting rules
 * @param amount Amount to format
 * @param currency Currency code
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  // Handle edge cases where currency might be undefined or invalid
  if (!currency || !Object.keys(CURRENCY_SYMBOLS).includes(currency)) {
    console.warn(`Invalid currency provided: ${currency}, using USD as fallback`);
    currency = 'USD' as Currency;
  }
  
  // Get decimal places based on currency type
  const decimalPlaces = NO_DECIMAL_CURRENCIES.includes(currency) ? 0 : 2;
  
  // Format the number part with appropriate decimal places
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
  
  // Get the correct currency symbol from our mapping
  const symbol = CURRENCY_SYMBOLS[currency];
  
  // Return the formatted string with our custom symbol
  return `${symbol}${formatter.format(amount)}`;
};

/**
 * Formats a percentage value with appropriate sign and decimal places
 * @param value Percentage value to format
 * @param showSign Whether to show + sign for positive values
 * @param decimalPlaces Number of decimal places to show
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number, 
  showSign: boolean = false, 
  decimalPlaces: number = 1
): string => {
  const formattedValue = value.toFixed(decimalPlaces);
  const prefix = showSign && value > 0 ? '+' : '';
  return `${prefix}${formattedValue}%`;
};

/**
 * Determines if an expense percentage change is positive (bad) or negative (good)
 * For expenses, an increase is bad (positive = true), a decrease is good (positive = false)
 * @param percentageChange Percentage change value
 * @returns Boolean indicating if change is positive (bad for expenses)
 */
export const isExpenseChangePositive = (percentageChange: number): boolean => {
  return percentageChange >= 0;
};

/**
 * Gets the appropriate color class for an expense trend
 * @param percentageChange Percentage change value
 * @returns CSS class for coloring the trend
 */
export const getExpenseTrendColor = (percentageChange: number): string => {
  const isPositive = isExpenseChangePositive(percentageChange);
  return isPositive 
    ? "text-red-500 dark:text-red-400" 
    : "text-green-500 dark:text-green-400";
};

/**
 * Formats a date string in a consistent way
 * @param dateString ISO date string
 * @returns Formatted date (e.g., "Jan 15, 2023")
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

/**
 * Formats a date string in a short format
 * @param dateString ISO date string
 * @returns Formatted date (e.g., "01/15/23")
 */
export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    month: '2-digit', 
    day: '2-digit', 
    year: '2-digit' 
  });
};

/**
 * Formats a date with time
 * @param dateString ISO date string
 * @returns Formatted date with time (e.g., "Jan 15, 2023 2:30 PM")
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

/**
 * Gets the current date as an ISO string (YYYY-MM-DD)
 * @returns Current date in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Available currency options for dropdown selects
 */
export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
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
