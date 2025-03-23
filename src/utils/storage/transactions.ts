
import { Transaction } from '@/types';

// LocalStorage key
const TRANSACTIONS_KEY = 'expenseTracker_transactions';

// Save transactions to localStorage
export const saveTransactions = (transactions: Transaction[]): void => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

// Get transactions from localStorage
export const getTransactions = (): Transaction[] => {
  const stored = localStorage.getItem(TRANSACTIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Add a new transaction
export const addTransaction = (transaction: Omit<Transaction, 'id'>): Transaction => {
  const transactions = getTransactions();
  const newTransaction = {
    ...transaction,
    id: Date.now().toString(),
  };
  
  transactions.push(newTransaction);
  saveTransactions(transactions);
  return newTransaction as Transaction;
};
