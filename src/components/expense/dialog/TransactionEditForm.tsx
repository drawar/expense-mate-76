
import { Transaction } from '@/types';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ExpenseForm from '../ExpenseForm';

interface TransactionEditFormProps {
  transaction: Transaction;
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

const TransactionEditForm = ({
  transaction,
  paymentMethods,
  onSubmit,
  onCancel,
}: TransactionEditFormProps) => {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogDescription>
          Make changes to your transaction details.
        </DialogDescription>
      </DialogHeader>
      
      <ExpenseForm
        paymentMethods={paymentMethods}
        onSubmit={onSubmit}
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
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
};

export default TransactionEditForm;
