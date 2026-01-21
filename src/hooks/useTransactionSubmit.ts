// hooks/useTransactionSubmit.ts - NEW ADAPTER HOOK
import { useState } from "react";
import { Transaction, Currency, Merchant } from "@/types";
import { useTransactionActions } from "@/hooks/expense/useTransactionActions";
import { storageService } from "@/core/storage";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// Re-export the type from ExpenseForm
export type { SplitTransactionInput } from "@/components/expense/form/ExpenseForm";
import type { SplitTransactionInput } from "@/components/expense/form/ExpenseForm";

/**
 * Adapter hook for backward compatibility
 * Uses the new useTransactionActions hook internally
 */
export const useTransactionSubmit = (useLocalStorage: boolean = false) => {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSplitLoading, setIsSplitLoading] = useState(false);
  const { handleAdd, isLoading } = useTransactionActions();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Set storage mode for the service
  storageService.setLocalStorageMode(useLocalStorage);

  /**
   * Submit a transaction
   */
  const handleSubmit = async (transactionData: Omit<Transaction, "id">) => {
    try {
      console.log("Starting transaction save process...");
      setSaveError(null);

      // Use the new handleAdd function from useTransactionActions
      const result = await handleAdd(transactionData);

      if (!result) {
        throw new Error("Failed to save transaction");
      }

      return result;
    } catch (error) {
      console.error("Error in transaction submit:", error);

      let errorMessage = "Failed to save transaction";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setSaveError(errorMessage);
      return null;
    }
  };

  /**
   * Submit a split transaction
   */
  const handleSplitSubmit = async (input: SplitTransactionInput) => {
    try {
      console.log("Starting split transaction save process...");
      setSaveError(null);
      setIsSplitLoading(true);

      // Convert the input to the format expected by StorageService
      const result = await storageService.addSplitTransaction({
        totalAmount: input.totalAmount,
        currency: input.currency,
        merchant: {
          id: input.merchant.id || "",
          name: input.merchant.name,
          address: input.merchant.address,
          isOnline: input.merchant.isOnline,
          mcc: input.merchant.mcc || undefined,
        } as Merchant,
        date: input.date,
        portions: input.portions,
        isContactless: input.isContactless,
        notes: input.notes,
        userCategory: input.userCategory,
      });

      if (!result || result.length === 0) {
        throw new Error("Failed to save split transaction");
      }

      toast({
        title: "Split Transaction Saved",
        description: `Created ${result.length} linked transactions`,
      });

      // Navigate back to transactions list
      navigate("/transactions");

      return result;
    } catch (error) {
      console.error("Error in split transaction submit:", error);

      let errorMessage = "Failed to save split transaction";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setSaveError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSplitLoading(false);
    }
  };

  return {
    handleSubmit,
    handleSplitSubmit,
    isLoading: isLoading || isSplitLoading,
    saveError,
  };
};
