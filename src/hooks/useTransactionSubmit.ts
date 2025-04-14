// hooks/useTransactionSubmit.ts - NEW ADAPTER HOOK
import { useState } from 'react';
import { Transaction } from '@/types';
import { useTransactionActions } from '@/hooks/expense/useTransactionActions';
import { storageService } from '@/core/storage/StorageService';

/**
 * Adapter hook for backward compatibility 
 * Uses the new useTransactionActions hook internally
 */
export const useTransactionSubmit = (useLocalStorage: boolean = false) => {
  const [saveError, setSaveError] = useState<string | null>(null);
  const { handleAdd, isLoading } = useTransactionActions();

  // Set storage mode for the service
  storageService.setLocalStorageMode(useLocalStorage);

  /**
   * Submit a transaction
   */
  const handleSubmit = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      console.log('Starting transaction save process...');
      setSaveError(null);
      
      // Use the new handleAdd function from useTransactionActions
      const result = await handleAdd(transactionData);
      
      if (!result) {
        throw new Error('Failed to save transaction');
      }
      
      return result;
    } catch (error) {
      console.error('Error in transaction submit:', error);
      
      let errorMessage = 'Failed to save transaction';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setSaveError(errorMessage);
      return null;
    }
  };

  return { handleSubmit, isLoading, saveError };
};
