import { Transaction, PaymentMethod } from '@/types';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExpenseForm } from '../../form/ExpenseForm';

export interface TransactionEditFormProps {
  transaction: Transaction;
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;  // Add isLoading prop with optional type
}

export const TransactionEditForm: React.FC<TransactionEditFormProps> = ({
  transaction,
  paymentMethods,
  onSubmit,
  onCancel,
  isLoading = false,  // Default to false
}) => {
  // Safely access reimbursementAmount or default to 0
  const reimbursementAmount = transaction.reimbursementAmount || 0;
  
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
          reimbursementAmount: reimbursementAmount ? reimbursementAmount.toString() : '0',
          date: new Date(transaction.date),
          notes: transaction.notes,
          mcc: transaction.merchant.mcc,
        }}
      />
      
      <DialogFooter className="gap-2 sm:gap-0 mt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}  // Disable the button when loading
        >
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
};

export default TransactionEditForm;
