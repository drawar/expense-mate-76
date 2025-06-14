
import { Transaction } from '@/types';
import { storageService } from '@/core/storage/StorageService';

export async function editTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
  console.log('Editing transaction:', id, updates);
  
  try {
    const updatedTransaction = await storageService.updateTransaction(id, updates);
    console.log('Transaction updated successfully:', updatedTransaction);
    return updatedTransaction;
  } catch (error) {
    console.error('Error editing transaction:', error);
    throw error;
  }
}
