
// Centralized exports from refactored modules
export { MCC_CODES } from './constants/mcc';
export { getTransactions, saveTransactions, addTransaction } from './storage/transactions';
export { getPaymentMethods, savePaymentMethods } from './storage/paymentMethods';
export { 
  getMerchants, 
  saveMerchants, 
  getMerchantByName, 
  addOrUpdateMerchant 
} from './storage/merchants';
export { defaultPaymentMethods } from './defaults/paymentMethods';

// Initialize storage with default data
export const initializeStorage = (): void => {
  // Import dynamically to avoid circular dependencies
  const { getPaymentMethods, savePaymentMethods } = require('./storage/paymentMethods');
  const { defaultPaymentMethods } = require('./defaults/paymentMethods');
  
  // Set up default payment methods if none exist
  if (!localStorage.getItem('expenseTracker_paymentMethods')) {
    savePaymentMethods(defaultPaymentMethods);
  }
};
