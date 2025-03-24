
import { useState } from 'react';
import { Transaction } from '@/types';
import { deleteTransaction, editTransaction } from '@/utils/storageUtils';
import { useToast } from '@/hooks/use-toast';

export const useTransactionActions = (transactions: Transaction[], setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>) => {
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>('view');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDialogMode('view');
    setIsTransactionDialogOpen(true);
  };
  
  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDialogMode('edit');
    setIsTransactionDialogOpen(true);
  };
  
  const handleDeleteTransaction = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      setIsLoading(true);
      
      // Optimistically update the UI first for better user experience
      setTransactions(prev => prev.filter(tx => tx.id !== transactionToDelete.id));
      
      const success = await deleteTransaction(transactionToDelete.id);
      
      if (success) {
        toast({
          title: "Transaction deleted",
          description: "The transaction has been successfully deleted.",
        });
      } else {
        // If there was a problem, revert the optimistic update
        toast({
          title: "Warning",
          description: "Delete operation may not have synced with remote database.",
        });
        // No need to revert transactions state since we're already assuming it was deleted locally
      }
      
      setDeleteConfirmOpen(false);
      setIsTransactionDialogOpen(false);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      
      // Revert the optimistic update if there was an exception
      const originalTransaction = transactionToDelete;
      if (originalTransaction) {
        setTransactions(prev => [...prev, originalTransaction]);
      }
      
      toast({
        title: "Error",
        description: "Failed to delete the transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveEdit = async (updatedTransaction: Omit<Transaction, 'id'>) => {
    if (!selectedTransaction) return;
    
    try {
      setIsLoading(true);
      const result = await editTransaction(selectedTransaction.id, updatedTransaction);
      
      if (result) {
        // Update local state immediately for better UX
        setTransactions(prev => 
          prev.map(tx => tx.id === selectedTransaction.id ? result : tx)
        );
        
        toast({
          title: "Transaction updated",
          description: "The transaction has been successfully updated.",
        });
        
        setIsTransactionDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update the transaction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update the transaction.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    selectedTransaction,
    isTransactionDialogOpen,
    setIsTransactionDialogOpen,
    dialogMode,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    transactionToDelete,
    isLoading,
    handleViewTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    confirmDeleteTransaction,
    handleSaveEdit
  };
};
