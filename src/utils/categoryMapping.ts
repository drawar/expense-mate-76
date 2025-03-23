
import { MerchantCategoryCode } from '@/types';

// Map MCC codes to categories
export const getCategoryFromMCC = (mccCode?: string): string => {
  if (!mccCode) return 'Uncategorized';
  
  // Grocery stores
  if (['5411', '5422', '5499'].includes(mccCode)) {
    return 'Groceries';
  }
  
  // Food & Drink
  if (['5811', '5812', '5813', '5814'].includes(mccCode)) {
    return 'Food & Drinks';
  }
  
  // Travel
  if (mccCode.startsWith('4') || ['7011', '7512'].includes(mccCode)) {
    return 'Travel';
  }
  
  // Shopping
  if (mccCode.startsWith('5') && !['5411', '5422', '5499', '5811', '5812', '5813', '5814'].includes(mccCode)) {
    return 'Shopping';
  }
  
  // Entertainment
  if (['7832', '7841', '7922', '7929', '7991', '7995', '7996', '7999'].includes(mccCode)) {
    return 'Entertainment';
  }
  
  // Services
  if (mccCode.startsWith('7') && !['7832', '7841', '7922', '7929', '7991', '7995', '7996', '7999'].includes(mccCode)) {
    return 'Services';
  }
  
  // Healthcare
  if (mccCode.startsWith('8')) {
    return 'Healthcare';
  }
  
  return 'Uncategorized';
};
