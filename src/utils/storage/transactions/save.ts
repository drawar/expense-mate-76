
import { Transaction } from '@/types';
import { storageService } from '@/core/storage/StorageService';

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  console.log('Saving transactions:', transactions.length);
  
  try {
    // Save each transaction individually using the storage service
    for (const transaction of transactions) {
      if (transaction.id) {
        // Update existing transaction
        await storageService.updateTransaction(transaction.id, transaction);
      } else {
        // Add new transaction
        await storageService.addTransaction(transaction);
      }
    }
    console.log('All transactions saved successfully');
  } catch (error) {
    console.error('Error saving transactions:', error);
    throw error;
  }
}
