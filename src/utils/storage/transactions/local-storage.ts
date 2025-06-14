
import { Transaction } from '@/types';

const TRANSACTIONS_STORAGE_KEY = 'expense-tracker-transactions';

export function getTransactionsFromLocalStorage(): Transaction[] {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading transactions from localStorage:', error);
    return [];
  }
}

export function saveTransactionsToLocalStorage(transactions: Transaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
    console.log('Transactions saved to localStorage:', transactions.length);
  } catch (error) {
    console.error('Error saving transactions to localStorage:', error);
    throw error;
  }
}
