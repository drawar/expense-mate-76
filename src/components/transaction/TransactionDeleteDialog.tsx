import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface TransactionDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void;
  isLoading?: boolean;
}

/**
 * Transaction-specific delete confirmation dialog.
 * Uses the generic ConfirmationDialog under the hood.
 */
const TransactionDeleteDialog = ({
  isOpen,
  onOpenChange,
  onConfirmDelete,
  isLoading = false,
}: TransactionDeleteDialogProps) => {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onConfirm={onConfirmDelete}
      title="Confirm Delete"
      description="Are you sure you want to delete this transaction? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      variant="destructive"
      isLoading={isLoading}
    />
  );
};

export default TransactionDeleteDialog;
