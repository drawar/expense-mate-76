import { useState } from "react";
import { Transaction, PaymentMethod } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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

  const handleRecordRefund = async () => {
    try {
      // Create refund transaction with reversed amounts and current date
      const refundTransaction: Omit<Transaction, "id"> = {
        date: new Date().toISOString(),
        merchant: transaction.merchant,
        amount: -transaction.amount,
        currency: transaction.currency,
        paymentMethod: transaction.paymentMethod,
        paymentAmount: -transaction.paymentAmount,
        paymentCurrency: transaction.paymentCurrency,
        rewardPoints: -transaction.rewardPoints,
        basePoints: -transaction.basePoints,
        bonusPoints: -transaction.bonusPoints,
        promoBonusPoints: transaction.promoBonusPoints
          ? -transaction.promoBonusPoints
          : undefined,
        isContactless: transaction.isContactless,
        notes: `Refund for transaction on ${transaction.date.split("T")[0]}`,
        mccCode: transaction.mccCode,
        userCategory: transaction.userCategory,
        category: transaction.category,
        isRecategorized: transaction.isRecategorized,
        tags: transaction.tags,
      };

      const result = await storageService.addTransaction(refundTransaction);

      if (result) {
        toast.success("Refund recorded successfully");
        if (onTransactionUpdated) {
          // Refresh the view by passing the original transaction
          // The parent will refetch transactions
          onTransactionUpdated(transaction);
        }
        onClose();
      }
    } catch (error) {
      console.error("Error recording refund:", error);
      toast.error("Failed to record refund");
    }
  };

  return (
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
  );
};
