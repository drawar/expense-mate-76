import { useState } from "react";
import { Transaction } from "@/types";
import { useTransactionActions } from "@/hooks/expense/useTransactionActions";

export function useTransactionManagement(
  transactions: Transaction[],
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>
) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit" | "delete">(
    "view"
  );
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  const {
    isLoading,
    handleSave,
    handleDelete,
    handleAdd,
    handleExportCSV,
    isCreating,
    isUpdating,
    isDeleting,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateMerchantTracking,
  } = useTransactionActions();

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDialogMode("view");
    setIsTransactionDialogOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDialogMode("edit");
    setIsTransactionDialogOpen(true);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (transactionToDelete) {
      // Find the transaction object first
      const transactionToDeleteObj = transactions.find(
        (t) => t.id === transactionToDelete
      );
      if (transactionToDeleteObj) {
        const success = await handleDelete(transactionToDeleteObj);

        // Only update local state if delete succeeded
        if (success) {
          setTransactions((prev) =>
            prev.filter((t) => t.id !== transactionToDelete)
          );
        }
      }

      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleSaveEdit = async (updatedTransaction: Transaction) => {
    const { id, ...transactionData } = updatedTransaction;
    await handleSave(id, transactionData);

    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    );

    // Update selected transaction so dialog shows updated data
    setSelectedTransaction(updatedTransaction);

    // Don't close dialog - TransactionDialog handles switching back to view mode

    if (
      updatedTransaction.merchant?.name &&
      selectedTransaction?.merchant?.name !== updatedTransaction.merchant.name
    ) {
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

    isCreating,
    isUpdating,
    isDeleting,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    updateMerchantTracking,
  };
}
