
import { useState } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

// Import our new components
import TransactionDialogHeader from './dialog/TransactionDialogHeader';
import TransactionDetailsView from './dialog/TransactionDetailsView';
import TransactionDialogActions from './dialog/TransactionDialogActions';
import TransactionEditForm from './dialog/TransactionEditForm';

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
            <TransactionDialogHeader transaction={transaction} />
            <TransactionDetailsView transaction={transaction} />
            <TransactionDialogActions 
              transaction={transaction} 
              onDelete={onDelete} 
              onEdit={() => setDialogMode('edit')} 
            />
          </>
        ) : (
          <TransactionEditForm 
            transaction={transaction}
            paymentMethods={paymentMethods}
            onSubmit={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
