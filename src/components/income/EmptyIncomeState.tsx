import React from "react";
import { WalletIcon } from "lucide-react";
import { EmptyState } from "@/components/dashboard/layout/EmptyState";

interface EmptyIncomeStateProps {
  onAddClick: () => void;
}

/**
 * Empty state for when no income sources exist.
 * Uses the consolidated EmptyState component with the "dashed" variant.
 */
export const EmptyIncomeState: React.FC<EmptyIncomeStateProps> = ({
  onAddClick,
}) => {
  return (
    <EmptyState
      variant="dashed"
      size="lg"
      title="No Income Sources"
      description="Add your salary or other income sources to track your net cash flow and savings."
      icon={<WalletIcon />}
      action={{
        label: "Add Your First Income",
        onClick: onAddClick,
      }}
    />
  );
};
