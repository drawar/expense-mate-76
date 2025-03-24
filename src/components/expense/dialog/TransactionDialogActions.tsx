
import { Transaction } from '@/types';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditIcon, TrashIcon } from 'lucide-react';

interface TransactionDialogActionsProps {
  transaction: Transaction;
  onDelete: (transaction: Transaction) => void;
  onEdit: () => void;
}

const TransactionDialogActions = ({
  transaction,
  onDelete,
  onEdit,
}: TransactionDialogActionsProps) => {
  return (
    <DialogFooter className="gap-2 sm:gap-0">
      <Button
        variant="destructive"
        className="gap-1"
        onClick={() => onDelete(transaction)}
      >
        <TrashIcon className="h-4 w-4" />
        Delete
      </Button>
      <Button
        className="gap-1"
        onClick={onEdit}
      >
        <EditIcon className="h-4 w-4" />
        Edit
      </Button>
    </DialogFooter>
  );
};

export default TransactionDialogActions;
