
import { storageService } from '@/core/storage/StorageService';

export async function deleteTransaction(id: string): Promise<void> {
  console.log('Deleting transaction:', id);
  
  try {
    await storageService.deleteTransaction(id);
    console.log('Transaction deleted successfully');
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}
