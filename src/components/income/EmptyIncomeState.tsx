import React from "react";
import { WalletIcon } from "lucide-react";
import { EmptyState } from "@/components/dashboard/layout/EmptyState";

interface EmptyIncomeStateProps {
  onAddClick: () => void;
}

/**
 * Empty state for when no payslips exist.
 * Uses the consolidated EmptyState component with the "dashed" variant.
 */
export const EmptyIncomeState: React.FC<EmptyIncomeStateProps> = ({
  onAddClick,
}) => {
  return (
    <EmptyState
      variant="dashed"
      size="lg"
      title="No Payslips"
      description="Add your payslips to track your income and net cash flow."
      icon={<WalletIcon />}
      action={{
        label: "Add Your First Payslip",
        onClick: onAddClick,
      }}
    />
  );
};
