
import { Transaction, PaymentMethod } from '@/types';
import TransactionDialog from '@/components/expense/TransactionDialog';
import TransactionDeleteDialog from '@/components/transaction/TransactionDeleteDialog';

interface TransactionDialogsContainerProps {
  selectedTransaction: Transaction | null;
  isTransactionDialogOpen: boolean;
  setIsTransactionDialogOpen: (isOpen: boolean) => void;
  dialogMode: 'view' | 'edit';
  deleteConfirmOpen: boolean;
  setDeleteConfirmOpen: (isOpen: boolean) => void;
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  onConfirmDelete: () => void;
}

const TransactionDialogsContainer = ({
  selectedTransaction,
  isTransactionDialogOpen,
  setIsTransactionDialogOpen,
  dialogMode,
  deleteConfirmOpen,
  setDeleteConfirmOpen,
  transactions,
  paymentMethods,
  onEdit,
  onDelete,
  onSave,
  onConfirmDelete,
}: TransactionDialogsContainerProps) => {
  return (
    <>
      {selectedTransaction && (
        <TransactionDialog
          transaction={selectedTransaction}
          paymentMethods={paymentMethods}
          allTransactions={transactions}
          isOpen={isTransactionDialogOpen}
          mode={dialogMode}
          onClose={() => setIsTransactionDialogOpen(false)}
          onEdit={onEdit}
          onDelete={onDelete}
          onSave={onSave}
        />
      )}
      
      <TransactionDeleteDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={onConfirmDelete}
      />
    </>
  );
};

export default TransactionDialogsContainer;
