import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types';
import { 
  createTransaction, 
  updateTransaction as updateTransactionStorage, 
  deleteTransaction as deleteTransactionStorage 
} from '@/utils/storage/transactions';
import { updateMerchantTracking } from '@/utils/storage/merchantTracking';
import { addBonusPointsMovement, deleteBonusPointsMovements } from '@/utils/storage/transactions/bonus-points';

export function useTransactionActions() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateTransaction = async (transaction: Transaction) => {
    setIsCreating(true);
    try {
      const success = await createTransaction(transaction);
      if (success) {
        toast({
          title: "Success",
          description: "Transaction created successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create transaction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to create transaction.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTransaction = async (transaction: Transaction) => {
    setIsUpdating(true);
    try {
      const success = await updateTransactionStorage(transaction);
      if (success) {
        toast({
          title: "Success",
          description: "Transaction updated successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update transaction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Fixed function where the parameter count was causing errors
  const handleDeleteTransaction = async (transactionId: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteTransactionStorage(transactionId);
      
      if (result) {
        toast({
          title: "Success",
          description: "Transaction deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete transaction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateMerchantTracking = async (merchantName: string) => {
    try {
      await updateMerchantTracking(merchantName);
    } catch (error) {
      console.error("Error updating merchant tracking:", error);
    }
  };
  
  return {
    isCreating,
    isUpdating,
    isDeleting,
    createTransaction: handleCreateTransaction,
    updateTransaction: handleUpdateTransaction,
    deleteTransaction: handleDeleteTransaction,
    updateMerchantTracking: handleUpdateMerchantTracking,
  };
}
