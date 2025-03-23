
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
export { getPaymentMethods, savePaymentMethods, initializePaymentMethods } from './storage/paymentMethods';
export { 
  getMerchants, 
  getMerchantByName, 
  addOrUpdateMerchant 
} from './storage/merchants';
export { defaultPaymentMethods } from './defaults/paymentMethods';
export { getCategoryFromMCC } from './categoryMapping';

// Initialize storage with default data
export const initializeStorage = async (): Promise<void> => {
  // Set up default payment methods if none exist
  const paymentMethods = await getPaymentMethods();
  if (paymentMethods.length === 0) {
    await initializePaymentMethods();
  }
};
