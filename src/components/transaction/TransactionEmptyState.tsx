import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/dashboard/layout/EmptyState";

interface TransactionEmptyStateProps {
  hasTransactions: boolean;
  onResetFilters: () => void;
}

/**
 * Empty state for transaction list.
 * Shows different content based on whether filters are applied.
 * Uses the consolidated EmptyState component.
 */
const TransactionEmptyState = ({
  hasTransactions,
  onResetFilters,
}: TransactionEmptyStateProps) => {
  const navigate = useNavigate();

  if (hasTransactions) {
    // Filtered view - no matching results
    return (
      <EmptyState
        variant="card"
        title="No matching transactions"
        description="No transactions match your filters."
        secondaryAction={{
          label: "Reset Filters",
          onClick: onResetFilters,
          variant: "outline",
        }}
        hideAction
      />
    );
  }

  // No transactions at all
  return (
    <EmptyState
      variant="card"
      title="No transactions yet"
      description="No transactions recorded yet."
      action={{
        label: "Record Your First Expense",
        onClick: () => navigate("/add-expense"),
      }}
    />
  );
};

export default TransactionEmptyState;
