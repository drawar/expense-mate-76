// Update this file to export the exportTransactionsToCSV function
import { storageService } from './StorageService';

// Re-export the storage service for easy access
export { storageService };

// Re-export specific methods for backward compatibility
export const getTransactions = () => storageService.getTransactions();
export const addTransaction = (data: any) => storageService.addTransaction(data);
export const editTransaction = (id: string, data: any) => storageService.editTransaction(id, data);
export const deleteTransaction = (id: string) => storageService.deleteTransaction(id);
export const exportTransactionsToCSV = (transactions: any[]) => storageService.exportTransactionsToCSV(transactions);
