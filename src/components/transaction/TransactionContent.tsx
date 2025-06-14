
import React from 'react';
import { Transaction, PaymentMethod } from '@/types';
import { TransactionTable } from '@/components/expense/TransactionTable';
import { TransactionGroupView } from './TransactionGroupView';

interface TransactionContentProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onView: (transaction: Transaction) => void;
  viewMode: 'table' | 'group';
}

export const TransactionContent: React.FC<TransactionContentProps> = ({
  transactions,
  onEdit,
  onDelete,
  onView,
  viewMode
}) => {
  if (viewMode === 'group') {
    return (
      <TransactionGroupView
        transactions={transactions}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    );
  }

  return (
    <TransactionTable
      transactions={transactions}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
    />
  );
};

export default TransactionContent;
