import { Transaction } from "@/types";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface TransactionDialogHeaderProps {
  transaction: Transaction;
}

const TransactionDialogHeader = ({
  transaction,
}: TransactionDialogHeaderProps) => {
  return (
    <DialogHeader showCloseButton>
      <DialogTitle className="text-xl flex items-center gap-2">
        <span className="truncate">{transaction.merchant.name}</span>
        {transaction.merchant.isOnline && (
          <Badge variant="secondary" className="shrink-0">
            Online
          </Badge>
        )}
        {transaction.isContactless && !transaction.merchant.isOnline && (
          <Badge variant="secondary" className="shrink-0">
            Contactless
          </Badge>
        )}
      </DialogTitle>
    </DialogHeader>
  );
};

export default TransactionDialogHeader;
