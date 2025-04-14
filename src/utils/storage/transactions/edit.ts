
import { Transaction } from '@/types';

export async function editTransaction(id: string, transactionData: Partial<Transaction>): Promise<Transaction> {
  // Implementation of editing transaction
  return {
    id,
    ...transactionData,
  } as Transaction;
}
