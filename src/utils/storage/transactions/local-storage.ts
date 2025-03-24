
import { Transaction } from '@/types';

const STORAGE_KEY = 'lovable_expense_tracker_transactions';

export const getTransactionsFromLocalStorage = (): Transaction[] => {
  try {
    const storedTransactions = localStorage.getItem(STORAGE_KEY);
    if (!storedTransactions) {
      return [];
    }
    
    const parsedTransactions = JSON.parse(storedTransactions) as Transaction[];
    
    // Filter out deleted transactions
    return parsedTransactions.filter(tx => !tx.isDeleted);
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
