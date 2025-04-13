// hooks/useTransactionActions.ts
import { useState } from 'react';
import { Transaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
  addTransaction as createTransaction,
  editTransaction as updateTransaction,
  deleteTransaction,
  incrementMerchantOccurrence,
  recordBonusPointsMovement as addBonusPointsMovement 
} from '@/services/storage';

// Create local aliases for backward compatibility
const updateTransactionStorage = updateTransaction;
const deleteTransactionStorage = deleteTransaction;

/**
 * Hook for transaction CRUD operations
 */
export function useTransactionActions() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Create a new transaction
   */
  const handleCreateTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
    setIsLoading(true);
    try {
      const result = await createTransaction(transaction);
      
      if (result) {
        toast({
          title: 'Success',
          description: 'Transaction created successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create transaction',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error creating transaction:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update an existing transaction
   */
  const handleUpdateTransaction = async (id: string, transactionData: Omit<Transaction, 'id'>): Promise<Transaction | null> => {
    setIsLoading(true);
    try {
      const result = await updateTransactionStorage(id, transactionData);
      
      if (result) {
        toast({
          title: 'Success',
          description: 'Transaction updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update transaction',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a transaction
   */
  const handleDeleteTransaction = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await deleteTransactionStorage(id);
      
      if (result) {
        toast({
          title: 'Success',
          description: 'Transaction deleted successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete transaction',
          variant: 'destructive',
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Record merchant occurrence
   */
  const handleRecordMerchantOccurrence = async (merchantName: string, mcc?: any): Promise<boolean> => {
    try {
      return await incrementMerchantOccurrence(merchantName, mcc);
    } catch (error) {
      console.error('Error recording merchant occurrence:', error);
      return false;
    }
  };

  /**
   * Record bonus points
   */
  const handleRecordBonusPoints = async (transactionId: string, paymentMethodId: string, points: number): Promise<boolean> => {
    try {
      return await addBonusPointsMovement(transactionId, paymentMethodId, points);
    } catch (error) {
      console.error('Error recording bonus points:', error);
      return false;
    }
  };

  return {
    isLoading,
    createTransaction: handleCreateTransaction,
    updateTransaction: handleUpdateTransaction,
    deleteTransaction: handleDeleteTransaction,
    recordMerchantOccurrence: handleRecordMerchantOccurrence,
    recordBonusPoints: handleRecordBonusPoints
  };
}

