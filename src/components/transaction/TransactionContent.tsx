import React from "react";
import { Transaction, PaymentMethod } from "@/types";
import TransactionTable from "@/components/expense/TransactionTable";
import TransactionGroupView from "./TransactionGroupView";

interface TransactionContentProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onView: (transaction: Transaction) => void;
  viewMode: "table" | "group";
  sortOption: string;
  onCategoryEdit?: (transaction: Transaction) => void;
}

export const TransactionContent: React.FC<TransactionContentProps> = ({
  transactions,
  paymentMethods,
  onEdit,
  onDelete,
  onView,
  viewMode,
  sortOption,
  onCategoryEdit,
}) => {
  if (viewMode === "group") {
    return (
      <TransactionGroupView
        transactions={transactions}
        sortOption={sortOption}
        onViewTransaction={onView}
      />
    );
  }

  return (
    <TransactionTable
      transactions={transactions}
      paymentMethods={paymentMethods}
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      onCategoryEdit={onCategoryEdit}
    />
  );
};

export default TransactionContent;
