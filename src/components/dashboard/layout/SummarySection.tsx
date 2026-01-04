// components/dashboard/layout/SummarySection.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { BudgetSpendingCard } from "@/components/dashboard/cards";
import { ArrowDownLeftIcon } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTimeframeDateRange } from "@/utils/dashboard";

/**
 * Dashboard section displaying unified budget + spending card
 */
const SummarySection: React.FC = () => {
  const navigate = useNavigate();
  const { dashboardData, displayCurrency, activeTab } = useDashboardContext();
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

  // Handle click on reimbursed transactions link
  const handleReimbursedClick = () => {
    const dateRange = getTimeframeDateRange(activeTab);
    const params = new URLSearchParams();
    params.set("hasReimbursement", "true");
    if (dateRange) {
      params.set("from", dateRange.from);
      params.set("to", dateRange.to);
    }
    navigate(`/transactions?${params.toString()}`);
  };

  return (
    <div className="w-full animate-fadeIn">
      {/* Unified Budget + Spending Card */}
      <BudgetSpendingCard
        className="rounded-xl border border-border/50 bg-card"
        transactions={dashboardData?.filteredTransactions || []}
      />

      {/* Reimbursements Card - only show when there are reimbursements */}
      {hasReimbursements && (
        <Card className="mt-4 rounded-xl border border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <ArrowDownLeftIcon className="h-5 w-5 text-primary" />
              Reimbursements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-medium tracking-tight text-[var(--color-success)]">
              {formatCurrency(metrics?.totalReimbursed || 0)}
            </p>
            <button
              onClick={handleReimbursedClick}
              className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors mt-1"
            >
              From {reimbursedTransactionsCount} transaction
              {reimbursedTransactionsCount !== 1 ? "s" : ""}
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default React.memo(SummarySection);
