
import { useState } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDate } from '@/utils/dateUtils';
import { calculateTransactionPoints } from '@/utils/rewardPoints';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EditIcon, TrashIcon, CreditCardIcon, CoinsIcon, CalendarIcon, MapPinIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ExpenseForm from './ExpenseForm';

interface TransactionDialogProps {
  transaction: Transaction | null;
  paymentMethods: PaymentMethod[];
  allTransactions: Transaction[];
  isOpen: boolean;
  mode: 'view' | 'edit';
  onClose: () => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
}

const TransactionDialog = ({
  transaction,
  paymentMethods,
  allTransactions,
  isOpen,
  mode,
  onClose,
  onEdit,
  onDelete,
  onSave,
}: TransactionDialogProps) => {
  const [dialogMode, setDialogMode] = useState<'view' | 'edit'>(mode);
  
  if (!transaction) return null;
  
  const handleSaveEdit = (updatedTransaction: Omit<Transaction, 'id'>) => {
    onSave(updatedTransaction);
    setDialogMode('view');
  };
  
  const handleCancelEdit = () => {
    setDialogMode('view');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setDialogMode(mode);
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        {dialogMode === 'view' ? (
          <>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Amount</h3>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  {transaction.currency !== transaction.paymentCurrency && (
                    <p className="text-sm text-muted-foreground">
                      Paid as {formatCurrency(transaction.paymentAmount, transaction.paymentCurrency)}
                    </p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Method</h3>
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{transaction.paymentMethod.name}</p>
                      <p className="text-sm text-muted-foreground">{transaction.paymentMethod.issuer}</p>
                    </div>
                  </div>
                </div>
                
                {transaction.rewardPoints > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Reward Points</h3>
                    <div className="flex items-center gap-2">
                      <CoinsIcon className="h-4 w-4 text-amber-500" />
                      <p className="font-medium">{transaction.rewardPoints.toLocaleString()} points</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {transaction.merchant.address && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Merchant Address</h3>
                    <p>{transaction.merchant.address}</p>
                  </div>
                )}
                
                {transaction.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                    <p>{transaction.notes}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Transaction ID</h3>
                  <p className="text-xs font-mono">{transaction.id}</p>
                </div>
              </div>
            </div>
            
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
                onClick={() => setDialogMode('edit')}
              >
                <EditIcon className="h-4 w-4" />
                Edit
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
              <DialogDescription>
                Make changes to your transaction details.
              </DialogDescription>
            </DialogHeader>
            
            <ExpenseForm
              paymentMethods={paymentMethods}
              onSubmit={handleSaveEdit}
              defaultValues={{
                merchantName: transaction.merchant.name,
                merchantAddress: transaction.merchant.address,
                isOnline: transaction.merchant.isOnline,
                isContactless: !!transaction.isContactless,
                amount: transaction.amount.toString(),
                currency: transaction.currency,
                paymentMethodId: transaction.paymentMethod.id,
                paymentAmount: transaction.paymentAmount.toString(),
                date: new Date(transaction.date),
                notes: transaction.notes,
                mcc: transaction.merchant.mcc,
              }}
            />
            
            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
