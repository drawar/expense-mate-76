import { useState } from "react";
import { Transaction, PaymentMethod } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useTransactionActions } from "@/hooks/expense/useTransactionActions";
import { getMccCategory } from "@/utils/categoryMapping";

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
