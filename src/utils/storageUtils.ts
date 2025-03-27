
// Centralized exports from refactored modules
export { MCC_CODES } from './constants/mcc';
export { 
  getTransactions, 
  saveTransactions, 
  addTransaction,
  editTransaction,
  deleteTransaction,
  exportTransactionsToCSV
} from './storage/transactions';
export { 
  getPaymentMethods, 
  savePaymentMethods, 
  initializePaymentMethods,
  uploadCardImage
} from './storage/paymentMethods';
export { 
  getMerchants, 
  getMerchantByName, 
  addOrUpdateMerchant 
} from './storage/merchants';
export {
  getMerchantCategoryMappings,
  getMerchantCategoryMappingByName,
  incrementMerchantOccurrence,
  decrementMerchantOccurrence,
  hasMerchantCategorySuggestions,
  getSuggestedMerchantCategory
} from './storage/merchantTracking';
export { defaultPaymentMethods } from './defaults/paymentMethods';
export { getCategoryFromMCC } from './categoryMapping';

// Initialize storage with default data
export const initializeStorage = async (): Promise<void> => {
  // Import needed functions directly to avoid circular dependencies
  const { getPaymentMethods, initializePaymentMethods } = await import('./storage/paymentMethods');
  
  // Force reinitialize payment methods to include any new default methods
  await initializePaymentMethods();
};
