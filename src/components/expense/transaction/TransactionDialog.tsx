import { useState } from "react";
import { Transaction, PaymentMethod } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTransactionActions } from "@/hooks/expense/useTransactionActions";
import { getMccCategory } from "@/utils/categoryMapping";
import { storageService } from "@/core/storage";
import { toast } from "sonner";

// Import sub-components
import TransactionDialogHeader from "./elements/TransactionDialogHeader";
import TransactionDetailsView from "./elements/TransactionDetailsView";
import TransactionEditForm from "./elements/TransactionEditForm";
import SplitTransactionEditForm from "./elements/SplitTransactionEditForm";

interface TransactionDialogProps {
  transaction: Transaction | null;
  paymentMethods: PaymentMethod[];
  isOpen: boolean;
  onClose: () => void;
  onTransactionUpdated?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  transaction,
  paymentMethods,
  isOpen,
  onClose,
  onTransactionUpdated,
  onDelete,
}) => {
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [showSplitRefundDialog, setShowSplitRefundDialog] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const { handleSave, isLoading } = useTransactionActions();

  if (!transaction) return null;

  const handleSaveEdit = async (
    updatedTransaction: Omit<Transaction, "id">
  ) => {
    const result = await handleSave(transaction.id, updatedTransaction);
    if (result && onTransactionUpdated) {
      onTransactionUpdated(result);
    }
    setDialogMode("view");
  };

  const handleCategoryChange = async (newCategory: string) => {
    const mccCategory = getMccCategory(transaction);
    const isRecategorized = newCategory !== mccCategory;

    const result = await handleSave(transaction.id, {
      userCategory: newCategory,
      category: newCategory,
      isRecategorized,
    });

    if (result && onTransactionUpdated) {
      onTransactionUpdated(result);
    }
  };

  const handleDeleteTransaction = onDelete
    ? () => {
        // Use parent's delete handler (shows confirmation dialog)
        onDelete(transaction.id);
        onClose();
      }
    : undefined;

  // Create a refund for a single transaction
  const createRefundForTransaction = (
    tx: Transaction
  ): Omit<Transaction, "id"> => ({
    date: new Date().toISOString(),
    merchant: tx.merchant,
    amount: -tx.amount,
    currency: tx.currency,
    paymentMethod: tx.paymentMethod,
    paymentAmount: -tx.paymentAmount,
    paymentCurrency: tx.paymentCurrency,
    rewardPoints: -tx.rewardPoints,
    basePoints: -tx.basePoints,
    bonusPoints: -tx.bonusPoints,
    promoBonusPoints: tx.promoBonusPoints ? -tx.promoBonusPoints : undefined,
    isContactless: tx.isContactless,
    notes: `Refund for transaction on ${tx.date.split("T")[0]}`,
    mccCode: tx.mccCode,
    userCategory: tx.userCategory,
    category: tx.category,
    isRecategorized: tx.isRecategorized,
    tags: tx.tags,
  });

  // Refund only the current transaction (single portion)
  const handleRefundSinglePortion = async () => {
    setIsRefunding(true);
    try {
      const refundTransaction = createRefundForTransaction(transaction);
      const result = await storageService.addTransaction(refundTransaction);

      if (result) {
        toast.success("Refund recorded successfully");
        if (onTransactionUpdated) {
          onTransactionUpdated(transaction);
        }
        setShowSplitRefundDialog(false);
        onClose();
      }
    } catch (error) {
      console.error("Error recording refund:", error);
      toast.error("Failed to record refund");
    } finally {
      setIsRefunding(false);
    }
  };

  // Refund all portions of the split transaction
  const handleRefundAllPortions = async () => {
    if (!transaction.splitGroupId) return;

    setIsRefunding(true);
    try {
      // Fetch all transactions in the split group
      const splitTransactions =
        await storageService.getTransactionsBySplitGroup(
          transaction.splitGroupId
        );

      // Create refunds for each portion
      let successCount = 0;
      for (const tx of splitTransactions) {
        const refundTransaction = createRefundForTransaction(tx);
        const result = await storageService.addTransaction(refundTransaction);
        if (result) successCount++;
      }

      if (successCount === splitTransactions.length) {
        toast.success(
          `Refund recorded for all ${successCount} portions successfully`
        );
      } else {
        toast.warning(
          `Refund recorded for ${successCount} of ${splitTransactions.length} portions`
        );
      }

      if (onTransactionUpdated) {
        onTransactionUpdated(transaction);
      }
      setShowSplitRefundDialog(false);
      onClose();
    } catch (error) {
      console.error("Error recording split refund:", error);
      toast.error("Failed to record refund");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleRecordRefund = async () => {
    // If this is a split transaction, show the split refund dialog
    if (transaction.splitGroupId) {
      setShowSplitRefundDialog(true);
      return;
    }

    // Otherwise, refund the single transaction directly
    await handleRefundSinglePortion();
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            onClose();
            setDialogMode("view");
          }
        }}
      >
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden"
          hideCloseButton
        >
          {dialogMode === "view" ? (
            <>
              <TransactionDialogHeader
                transaction={transaction}
                onClose={onClose}
              />
              <TransactionDetailsView
                transaction={transaction}
                onCategoryChange={handleCategoryChange}
                onDelete={handleDeleteTransaction}
                onEdit={() => setDialogMode("edit")}
                onRecordRefund={handleRecordRefund}
                isLoading={isLoading}
              />
            </>
          ) : transaction.splitGroupId ? (
            <SplitTransactionEditForm
              transaction={transaction}
              paymentMethods={paymentMethods}
              onSubmit={(transactions) => {
                // Use the first transaction as the updated reference
                if (transactions.length > 0 && onTransactionUpdated) {
                  onTransactionUpdated(transactions[0]);
                }
                setDialogMode("view");
                onClose();
              }}
              onCancel={() => setDialogMode("view")}
              isLoading={isLoading}
            />
          ) : (
            <TransactionEditForm
              transaction={transaction}
              paymentMethods={paymentMethods}
              onSubmit={handleSaveEdit}
              onCancel={() => setDialogMode("view")}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Split transaction refund confirmation dialog */}
      <AlertDialog
        open={showSplitRefundDialog}
        onOpenChange={setShowSplitRefundDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund Split Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              This transaction is part of a split payment. Would you like to
              refund all portions or just this one?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isRefunding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefundSinglePortion}
              disabled={isRefunding}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              {isRefunding ? "Processing..." : "This portion only"}
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleRefundAllPortions}
              disabled={isRefunding}
            >
              {isRefunding ? "Processing..." : "All portions"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
