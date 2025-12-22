// components/dashboard/layout/SummarySection.tsx
import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { SummaryCard, BudgetSpendingCard } from "@/components/dashboard/cards";
import { ArrowDownLeftIcon } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

/**
 * Dashboard section displaying unified budget + spending card
 */
const SummarySection: React.FC = () => {
  const { dashboardData, displayCurrency } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  const metrics = dashboardData?.metrics || {
    totalReimbursed: 0,
  };

  // Calculate count of transactions with reimbursements
  const reimbursedTransactionsCount = React.useMemo(() => {
    const filteredTransactions = dashboardData?.filteredTransactions || [];
    if (!filteredTransactions.length) return 0;
    return filteredTransactions.reduce(
      (count, tx) => (tx.reimbursementAmount ? count + 1 : count),
      0
    );
  }, [dashboardData]);

  const hasReimbursements = (metrics?.totalReimbursed || 0) > 0;

  return (
    <div className="w-full animate-fadeIn">
      {/* Unified Budget + Spending Card */}
      <BudgetSpendingCard
        className="rounded-xl border border-border/50 bg-card"
        transactions={dashboardData?.filteredTransactions || []}
      />

      {/* Reimbursements Card - only show when there are reimbursements */}
      {hasReimbursements && (
        <div className="mt-4">
          <SummaryCard
            title="Reimbursements"
            icon={<ArrowDownLeftIcon className="h-5 w-5 text-primary" />}
            value={formatCurrency(metrics?.totalReimbursed || 0)}
            description={`From ${reimbursedTransactionsCount} transaction${reimbursedTransactionsCount !== 1 ? "s" : ""}`}
            cardColor="bg-[var(--color-accent-subtle)]"
            valueColor="text-[var(--color-success)]"
          />
        </div>
      )}
    </div>
  );
};

export default React.memo(SummarySection);
