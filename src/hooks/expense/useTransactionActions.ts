import { useState } from "react";
import { Transaction } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { storageService } from "@/core/storage";
import { useQueryClient } from "@tanstack/react-query";

export function useTransactionActions(options?: {
  onAddSuccess?: () => void;
  redirectPath?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { onAddSuccess, redirectPath = "/transactions" } = options || {};

  const handleSave = async (
    id: string,
    data: Partial<Transaction>
  ): Promise<Transaction | null> => {
    try {
      setIsLoading(true);
      const updated = await storageService.updateTransaction(id, data);
      // Invalidate transactions query to refresh UI
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      return updated;
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (transaction: Transaction): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await storageService.deleteTransaction(transaction.id);
      if (success) {
        // Invalidate transactions query to refresh UI
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          variant: "destructive",
        });
      }
      return success;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (
    transaction: Omit<Transaction, "id">
  ): Promise<Transaction | null> => {
    try {
      setIsLoading(true);
      const added = await storageService.addTransaction(transaction);
      // Invalidate transactions query to refresh UI (including cap progress)
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });

      // Handle navigation after success
      setTimeout(() => {
        if (onAddSuccess) {
          onAddSuccess();
        } else {
          window.location.href = redirectPath;
        }
      }, 100);

      return added;
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async (
    transactions: Transaction[]
  ): Promise<void> => {
    try {
      setIsLoading(true);
      const csvContent =
        await storageService.exportTransactionsToCSV(transactions);

      // Create a blob and download link
      const url = URL.createObjectURL(
        new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      );
      const link = document.createElement("a");

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Transactions exported successfully",
      });
    } catch (error) {
      console.error("Error exporting transactions:", error);
      toast({
        title: "Error",
        description: "Failed to export transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add missing properties expected by useTransactionManagement
  const updateMerchantTracking = async (merchantName: string) => {
    // Placeholder implementation
    console.log("Updating merchant tracking for:", merchantName);
  };

  return {
    isLoading,
    handleSave,
    handleDelete,
    handleAdd,
    handleExportCSV,
    // Add aliases and missing properties for backward compatibility
    isCreating: isLoading,
    isUpdating: isLoading,
    isDeleting: isLoading,
    createTransaction: handleAdd,
    updateTransaction: handleSave,
    deleteTransaction: handleDelete,
    updateMerchantTracking,
  };
}
