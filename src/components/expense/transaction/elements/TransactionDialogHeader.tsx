import { Transaction } from "@/types";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TransactionDialogHeaderProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionDialogHeader = ({
  transaction,
  onClose,
}: TransactionDialogHeaderProps) => {
  return (
    <DialogHeader
      className="border-b flex-shrink-0"
      showCloseButton
      onClose={onClose}
    >
      <DialogTitle>{transaction.merchant.name}</DialogTitle>
    </DialogHeader>
  );
};

export default TransactionDialogHeader;
