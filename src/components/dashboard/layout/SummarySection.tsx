// components/dashboard/layout/SummarySection.tsx
import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { SummaryCard, BudgetProgressCard } from "@/components/dashboard/cards";
import { ArrowDownLeftIcon } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";

/**
 * Dashboard section displaying summary statistics and key metrics
 */
const SummarySection: React.FC = () => {
  const { dashboardData, displayCurrency } = useDashboardContext();

  // Use the custom currency formatter hook
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Ensure we have valid data structure to prevent errors
  const metrics = dashboardData?.metrics || {
    totalExpenses: 0,
    transactionCount: 0,
    averageAmount: 0,
    totalRewardPoints: 0,
    percentageChange: 0,
    totalReimbursed: 0,
  };

  // Calculate count of transactions with reimbursements
  const reimbursedTransactionsCount = React.useMemo(() => {
    // Get the filtered transactions from dashboardData
    const filteredTransactions = dashboardData?.filteredTransactions || [];

    if (!filteredTransactions.length) return 0;

    return filteredTransactions.reduce(
      (count, tx) => (tx.reimbursementAmount ? count + 1 : count),
      0
    );
  }, [dashboardData]);

  const hasReimbursements = (metrics?.totalReimbursed || 0) > 0;

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 animate-fadeIn">
        {/* Budget Progress Card */}
        <BudgetProgressCard
          className="rounded-xl border border-border/50 bg-card"
          transactions={dashboardData?.filteredTransactions || []}
        />

        {/* Reimbursements Card - only show when there are reimbursements */}
        {hasReimbursements && (
          <SummaryCard
            title="Reimbursements"
            icon={<ArrowDownLeftIcon className="h-5 w-5 text-primary" />}
            value={formatCurrency(metrics?.totalReimbursed || 0)}
            description={`From ${reimbursedTransactionsCount} transaction${reimbursedTransactionsCount !== 1 ? "s" : ""}`}
            cardColor="bg-gradient-to-br from-green-500/10 to-emerald-600/10"
            valueColor="text-green-800 dark:text-green-300"
          />
        )}
      </div>
    </div>
  );
};

export default React.memo(SummarySection);
