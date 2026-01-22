import { Transaction, PaymentMethod } from "@/types";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "../../form/ExpenseForm";
import { format, parseISO } from "date-fns";

export interface TransactionEditFormProps {
  transaction: Transaction;
  paymentMethods: PaymentMethod[];
  onSubmit: (transaction: Omit<Transaction, "id">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const TransactionEditForm: React.FC<TransactionEditFormProps> = ({
  transaction,
  paymentMethods,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // Safely access reimbursementAmount or default to 0
  const reimbursementAmount = transaction.reimbursementAmount || 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <DialogHeader
        className="border-b flex-shrink-0"
        showBackButton
        onBack={onCancel}
      >
        <DialogTitle>Edit Transaction</DialogTitle>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <ExpenseForm
          paymentMethods={paymentMethods}
          onSubmit={onSubmit}
          isEditMode={true}
          defaultValues={{
            merchantId: transaction.merchant.id,
            merchantName: transaction.merchant.name,
            merchantAddress: transaction.merchant.address,
            isOnline: transaction.merchant.isOnline,
            isContactless: !!transaction.isContactless,
            amount: transaction.amount.toString(),
            currency: transaction.currency,
            paymentMethodId: transaction.paymentMethod.id,
            paymentAmount: transaction.paymentAmount.toString(),
            reimbursementAmount: reimbursementAmount
              ? reimbursementAmount.toString()
              : "0",
            date: parseISO(transaction.date),
            time: format(parseISO(transaction.date), "HH:mm"),
            notes: transaction.notes,
            mcc: transaction.merchant.mcc,
            rewardPoints: transaction.rewardPoints.toString(),
            basePoints: transaction.basePoints
              ? transaction.basePoints.toString()
              : "0",
            bonusPoints: transaction.bonusPoints
              ? transaction.bonusPoints.toString()
              : "0",
            promoBonusPoints: transaction.promoBonusPoints
              ? transaction.promoBonusPoints.toString()
              : "",
            tags: transaction.tags || "",
          }}
        />
      </div>
    </div>
  );
};

export default TransactionEditForm;
