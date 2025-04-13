
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Transaction } from '@/types';
import { 
  createTransaction, 
  updateTransaction as updateTransactionStorage, 
  deleteTransaction as deleteTransactionStorage 
} from '@/utils/storage/transactions';
import { incrementMerchantOccurrence } from '@/utils/storage/merchantTracking';
import { addBonusPointsMovement } from '@/utils/storage/transactions/bonus-points';

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
      // Call incrementMerchantOccurrence with both required arguments
      if (transaction.merchant?.name) {
        // Fix for the first error: Check if mcc is a string or an object with a code property
        let mccCode: string | undefined = undefined;
        
        if (transaction.merchant.mcc) {
          if (typeof transaction.merchant.mcc === 'string') {
            mccCode = transaction.merchant.mcc;
          } else if (transaction.merchant.mcc.code) {
            mccCode = transaction.merchant.mcc.code;
          }
        }
        
        // Now pass both arguments to incrementMerchantOccurrence
        await incrementMerchantOccurrence(transaction.merchant.name, mccCode);
      }
      
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

  const handleUpdateMerchantTracking = async (merchantName: string, mcc?: string | any) => {
    try {
      // Fix for the second error: Make sure we pass both required arguments
      // If mcc is undefined, explicitly pass undefined as the second argument
      await incrementMerchantOccurrence(merchantName, mcc);
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
