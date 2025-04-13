
import { TimeframeTab } from './transactionProcessor';

/**
 * Get the previous timeframe for comparison purposes
 */
export function getPreviousTimeframe(currentTimeframe: TimeframeTab): TimeframeTab {
  switch (currentTimeframe) {
    case 'today':
      return 'today'; // Compare with yesterday
    case 'week':
      return 'week'; // Compare with previous week
    case 'month':
      return 'month'; // Compare with previous month
    case 'quarter':
      return 'quarter'; // Compare with previous quarter
    case 'year':
      return 'year'; // Compare with previous year
    case 'all':
    default:
      return 'all'; // No comparison for all time
  }
}

/**
 * Format currency value with appropriate currency symbol
 */
export function formatCurrency(amount: number, currency: string = 'SGD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback formatting if Intl is not supported or currency is invalid
    return `${currency} ${amount.toFixed(2)}`;
  }
}
