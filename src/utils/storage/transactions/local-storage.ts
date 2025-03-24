
import { Transaction } from '@/types';

const STORAGE_KEY = 'lovable_expense_tracker_transactions';

export const getTransactionsFromLocalStorage = (): Transaction[] => {
  try {
    const storedTransactions = localStorage.getItem(STORAGE_KEY);
    if (!storedTransactions) {
      return [];
    }
    
    const parsedTransactions = JSON.parse(storedTransactions) as Transaction[];
    
    // Filter out deleted transactions using is_deleted property from backend
    // or a deleted flag that might be set when working locally
    return parsedTransactions.filter(tx => tx.is_deleted !== true);
  } catch (error) {
    console.error('Error retrieving transactions from localStorage:', error);
    return [];
  }
};

export const saveTransactionsToLocalStorage = (transactions: Transaction[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error('Error saving transactions to localStorage:', error);
  }
};

// Add a function to save a single transaction to localStorage
export const saveTransactionToLocalStorage = async (transaction: Transaction): Promise<boolean> => {
  try {
    // Get existing transactions
    const existingTransactions = getTransactionsFromLocalStorage();
    
    // Add new transaction or replace existing one
    const updatedTransactions = existingTransactions.some(tx => tx.id === transaction.id)
      ? existingTransactions.map(tx => tx.id === transaction.id ? transaction : tx)
      : [...existingTransactions, transaction];
    
    // Save updated array
    saveTransactionsToLocalStorage(updatedTransactions);
    return true;
  } catch (error) {
    console.error('Error saving transaction to localStorage:', error);
    return false;
  }
};
