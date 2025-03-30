
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
import {
  getLocalTransactions,
  saveLocalTransaction,
  deleteLocalTransaction
} from '@/services/LocalDatabaseService';

// Export all transaction-related functions
export {
  getTransactions,
  saveTransactions,
  addTransaction,
  editTransaction,
  deleteTransaction,
  exportTransactionsToCSV,
  getTransactionsFromLocalStorage,
  saveTransactionsToLocalStorage,
  // Export the new functions to make them available
  getLocalTransactions,
  saveLocalTransaction,
  deleteLocalTransaction
};
