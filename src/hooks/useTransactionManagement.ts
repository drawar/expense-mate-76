
import { useState } from 'react';
import { Transaction } from '@/types';
import { useTransactionActions } from './useTransactionActions';

/**
 * A hook for managing transaction operations beyond basic CRUD
 */
export function useTransactionManagement(
  transactions: Transaction[], 
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'delete'>('view');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Get the basic CRUD operations
  const {
    isCreating,
    isUpdating,
    isDeleting,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateMerchantTracking
  } = useTransactionActions();

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

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (transactionToDelete) {
      await deleteTransaction(transactionToDelete);
      
      // Update local state
      setTransactions(prev => 
        prev.filter(t => t.id !== transactionToDelete)
      );
      
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleSaveEdit = async (updatedTransaction: Transaction) => {
    await updateTransaction(updatedTransaction);
    
    // Update local state
    setTransactions(prev => 
      prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    );
    
    setIsTransactionDialogOpen(false);
    
    // If it's a merchant name change, update tracking
    if (updatedTransaction.merchant?.name && selectedTransaction?.merchant?.name !== updatedTransaction.merchant.name) {
      await updateMerchantTracking(updatedTransaction.merchant.name);
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
    handleViewTransaction,
    handleEditTransaction,
    handleDeleteTransaction,
    confirmDeleteTransaction,
    handleSaveEdit,
    
    // Pass through the basic CRUD operations
    isCreating,
    isUpdating,
    isDeleting,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateMerchantTracking
  };
}
