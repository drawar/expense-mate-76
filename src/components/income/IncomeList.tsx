import React from "react";
import { RecurringIncome } from "@/types";
import { IncomeCard } from "./IncomeCard";

interface IncomeListProps {
  incomeSources: RecurringIncome[];
  onEdit: (income: RecurringIncome) => void;
  onDelete: (id: string) => void;
}

export const IncomeList: React.FC<IncomeListProps> = ({
  incomeSources,
  onEdit,
  onDelete,
}) => {
  // Sort: active first, then by name
  const sortedIncome = [...incomeSources].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedIncome.map((income) => (
        <IncomeCard
          key={income.id}
          income={income}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
