import { Transaction } from "@/types";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditIcon, TrashIcon } from "lucide-react";

export interface TransactionDialogActionsProps {
  transaction: Transaction;
  onDelete?: () => void;
  onEdit: () => void;
  isLoading?: boolean;
}

export const TransactionDialogActions: React.FC<
  TransactionDialogActionsProps
> = ({ onDelete, onEdit, isLoading = false }) => {
  return (
    <DialogFooter className="gap-2 sm:gap-0">
      {onDelete && (
        <Button
          variant="destructive"
          className="gap-1"
          onClick={onDelete}
          disabled={isLoading}
        >
          <TrashIcon className="h-4 w-4" />
          Delete
        </Button>
      )}
      <Button className="gap-1" onClick={onEdit} disabled={isLoading}>
        <EditIcon className="h-4 w-4" />
        Edit
      </Button>
    </DialogFooter>
  );
};

export default TransactionDialogActions;
