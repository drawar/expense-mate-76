
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
export { getPaymentMethods, savePaymentMethods } from './storage/paymentMethods';
export { 
  getMerchants, 
  saveMerchants, 
  getMerchantByName, 
  addOrUpdateMerchant 
} from './storage/merchants';
export { defaultPaymentMethods } from './defaults/paymentMethods';

// Import directly to avoid using require()
import { getPaymentMethods, savePaymentMethods } from './storage/paymentMethods';
import { defaultPaymentMethods } from './defaults/paymentMethods';

// Initialize storage with default data
export const initializeStorage = (): void => {
  // Set up default payment methods if none exist
  if (!localStorage.getItem('expenseTracker_paymentMethods')) {
    savePaymentMethods(defaultPaymentMethods);
  }
};
