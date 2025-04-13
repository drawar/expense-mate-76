
import { Transaction, Currency } from '@/types';
import { addTransaction } from './transactions/add';
import { editTransaction } from './transactions/edit';
import { deleteTransaction } from './transactions/delete';
import { getTransactions } from './transactions/get';
import { exportTransactionsToCSV } from './transactions/export';
import { saveTransactions } from './transactions/save';
import { 
  getTransactionsFromLocalStorage, 
  saveTransactionsToLocalStorage 
} from './transactions/local-storage';

// Export all transaction-related functions with aliases for backward compatibility
export {
  getTransactions,
  saveTransactions,
  addTransaction as createTransaction, // Alias addTransaction as createTransaction
  editTransaction as updateTransaction, // Alias editTransaction as updateTransaction
  deleteTransaction,
  exportTransactionsToCSV,
  getTransactionsFromLocalStorage,
  saveTransactionsToLocalStorage
};

// Re-export the original function names too
export {
  addTransaction,
  editTransaction
};
