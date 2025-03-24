
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
      const success = await deleteTransaction(transactionToDelete.id);
      
      if (success) {
        setTransactions(prev => prev.filter(tx => tx.id !== transactionToDelete.id));
        
        toast({
          title: "Transaction deleted",
          description: "The transaction has been successfully deleted.",
        });
        
        setDeleteConfirmOpen(false);
        setIsTransactionDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete the transaction.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete the transaction.",
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
