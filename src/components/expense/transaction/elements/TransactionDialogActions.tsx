import { DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface TransactionDialogActionsProps {
  isLoading?: boolean;
}

export const TransactionDialogActions: React.FC<
  TransactionDialogActionsProps
> = ({ isLoading = false }) => {
  return (
    <DialogFooter className="pt-4 border-t">
      <DialogClose asChild>
        <Button variant="outline" className="w-full" disabled={isLoading}>
          Close
        </Button>
      </DialogClose>
    </DialogFooter>
  );
};

export default TransactionDialogActions;
