
import { Currency } from '@/types';

// Default symbol mapping for currencies
const currencySymbols: Record<Currency, string> = {
  SGD: 'S$',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CNY: '¥',
  INR: '₹',
  TWD: 'NT$',
  VND: '₫',
  IDR: 'Rp',
  THB: '฿',
  MYR: 'RM'
};

/**
 * Format a number as currency with the appropriate symbol
 * 
 * @param amount - Amount to format
 * @param currency - Currency code
 * @param options - Intl.NumberFormat options to override defaults
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: Currency,
  options: Intl.NumberFormatOptions = {}
): string => {
  try {
    // Log for debugging
    console.log(`Formatting currency: ${amount} ${currency}`);

    // For Singapore Dollar, use a custom format with S$ prefix
    if (currency === 'SGD') {
      // Use decimal style without currency symbol
      const formatter = new Intl.NumberFormat('en-SG', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        ...options
      });
      
      // Format with 'S$' prefix
      return `S$${formatter.format(amount)}`;
    }
    
    // For other currencies, use standard formatting
    const formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    });
    
    return formatter.format(amount);
  } catch (error) {
    console.error(`Error formatting currency ${currency}:`, error);
    return `${amount} ${currency}`; // Fallback format
  }
};

/**
 * Get currency symbol for given currency code
 * 
 * @param currency - Currency code
 * @returns Currency symbol or code if not found
 */
export const getCurrencySymbol = (currency: Currency): string => {
  return currencySymbols[currency] || currency;
};
