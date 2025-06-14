
import { Transaction } from '@/types';
import { storageService } from '@/core/storage/StorageService';

export async function addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  console.log('Adding transaction:', transaction);
  
  try {
    const savedTransaction = await storageService.addTransaction(transaction);
    console.log('Transaction added successfully:', savedTransaction);
    return savedTransaction;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
}
