import React from "react";
import { CreditCardIcon } from "lucide-react";
import { EmptyState } from "@/components/dashboard/layout/EmptyState";

interface EmptyPaymentMethodStateProps {
  onAddClick: () => void;
}

/**
 * Empty state for when no payment methods exist.
 * Uses the consolidated EmptyState component with the "dashed" variant.
 */
export const EmptyPaymentMethodState: React.FC<
  EmptyPaymentMethodStateProps
> = ({ onAddClick }) => {
  return (
    <EmptyState
      variant="dashed"
      size="lg"
      title="No Payment Methods"
      description="Add credit cards or cash payment methods to track your expenses and optimize reward points."
      icon={<CreditCardIcon />}
      action={{
        label: "Add Your First Payment Method",
        onClick: onAddClick,
      }}
    />
  );
};
