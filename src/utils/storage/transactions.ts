
import { Transaction } from '@/types';
import { getCategoryFromMCC } from '../categoryMapping';

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
    // Add category based on MCC code
    category: getCategoryFromMCC(transaction.merchant.mcc?.code),
  };
  
  transactions.push(newTransaction);
  saveTransactions(transactions);
  return newTransaction as Transaction;
};

// Edit an existing transaction
export const editTransaction = (id: string, updatedTransaction: Omit<Transaction, 'id'>): Transaction | null => {
  const transactions = getTransactions();
  const index = transactions.findIndex(tx => tx.id === id);
  
  if (index === -1) return null;
  
  const editedTransaction = {
    ...updatedTransaction,
    id,
    // Update category based on MCC code
    category: getCategoryFromMCC(updatedTransaction.merchant.mcc?.code),
  };
  
  transactions[index] = editedTransaction;
  saveTransactions(transactions);
  return editedTransaction as Transaction;
};

// Delete a transaction
export const deleteTransaction = (id: string): boolean => {
  const transactions = getTransactions();
  const filteredTransactions = transactions.filter(tx => tx.id !== id);
  
  if (filteredTransactions.length === transactions.length) {
    return false; // Transaction not found
  }
  
  saveTransactions(filteredTransactions);
  return true;
};

// Export a transactions list as CSV
export const exportTransactionsToCSV = (transactions: Transaction[]): string => {
  if (transactions.length === 0) {
    return '';
  }
  
  // CSV header
  const headers = [
    'ID',
    'Date',
    'Merchant',
    'Category',
    'Amount',
    'Currency',
    'Payment Method',
    'Payment Amount',
    'Payment Currency',
    'Reward Points',
    'Notes',
    'Contactless',
  ].join(',');
  
  // CSV rows
  const rows = transactions.map(tx => [
    tx.id,
    tx.date,
    tx.merchant.name,
    tx.category || tx.merchant.mcc?.description || 'Uncategorized',
    tx.amount,
    tx.currency,
    tx.paymentMethod.name,
    tx.paymentAmount,
    tx.paymentCurrency,
    tx.rewardPoints,
    tx.notes ? `"${tx.notes.replace(/"/g, '""')}"` : '',
    tx.isContactless ? 'Yes' : 'No',
  ].join(','));
  
  return [headers, ...rows].join('\n');
};

