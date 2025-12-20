// Update this file to export the exportTransactionsToCSV function
import { storageService, StorageService } from "./StorageService";
import type { Transaction } from "@/types";

// Re-export the storage service for easy access
export { storageService, StorageService };

// Re-export specific methods for backward compatibility
export const getTransactions = () => storageService.getTransactions();
export const addTransaction = (data: Omit<Transaction, "id">) =>
  storageService.addTransaction(data);
export const editTransaction = (id: string, data: Partial<Transaction>) =>
  storageService.updateTransaction(id, data);
export const deleteTransaction = (id: string) =>
  storageService.deleteTransaction(id);
export const exportTransactionsToCSV = (transactions: Transaction[]) =>
  storageService.exportTransactionsToCSV(transactions);
