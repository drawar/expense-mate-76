import { Transaction } from '@/types';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditIcon, TrashIcon } from 'lucide-react';

export interface TransactionDialogActionsProps {
  transaction: Transaction;
  onDelete: (transaction: Transaction) => void;
  onEdit: () => void;
  isLoading?: boolean;  // Add isLoading prop with optional type
}

export const TransactionDialogActions: React.FC<TransactionDialogActionsProps> = ({
  transaction,
  onDelete,
  onEdit,
  isLoading = false,  // Default to false
}) => {
  return (
    <DialogFooter className="gap-2 sm:gap-0">
      <Button
        variant="destructive"
        className="gap-1"
        onClick={() => onDelete(transaction)}
        disabled={isLoading}  // Disable the button when loading
      >
        <TrashIcon className="h-4 w-4" />
        {isLoading ? 'Deleting...' : 'Delete'}
      </Button>
      <Button
        className="gap-1"
        onClick={onEdit}
        disabled={isLoading}  // Disable the button when loading
      >
        <EditIcon className="h-4 w-4" />
        Edit
      </Button>
    </DialogFooter>
  );
};

export default TransactionDialogActions;
