
import { Transaction } from '@/types';
import { storageService } from '@/core/storage/StorageService';

export async function getTransactions(): Promise<Transaction[]> {
  console.log('Fetching transactions...');
  
  try {
    const transactions = await storageService.getTransactions();
    console.log('Transactions fetched successfully:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}
