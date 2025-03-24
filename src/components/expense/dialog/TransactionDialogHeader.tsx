
import { Transaction } from '@/types';
import { formatDate } from '@/utils/dateUtils';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, MapPinIcon } from 'lucide-react';

interface TransactionDialogHeaderProps {
  transaction: Transaction;
}

const TransactionDialogHeader = ({ transaction }: TransactionDialogHeaderProps) => {
  return (
    <DialogHeader>
      <DialogTitle className="text-xl flex items-center gap-2">
        <span>{transaction.merchant.name}</span>
        {transaction.merchant.isOnline && (
          <Badge variant="outline" className="ml-2">Online</Badge>
        )}
        {transaction.isContactless && !transaction.merchant.isOnline && (
          <Badge variant="outline" className="ml-2">Contactless</Badge>
        )}
      </DialogTitle>
      <DialogDescription className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm mt-2">
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{formatDate(transaction.date)}</span>
        </div>
        {transaction.merchant.mcc && (
          <div className="flex items-center gap-1">
            <MapPinIcon className="h-3.5 w-3.5" />
            <span>{transaction.merchant.mcc.description}</span>
          </div>
        )}
      </DialogDescription>
    </DialogHeader>
  );
};

export default TransactionDialogHeader;
