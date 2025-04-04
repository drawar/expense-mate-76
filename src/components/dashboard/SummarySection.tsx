
// src/components/dashboard/SummarySection.tsx
import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryCard from "./SummaryCard";
import { BarChartIcon, ArrowDownLeftIcon } from "lucide-react";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { TimeframeTab } from "@/utils/transactionProcessor";

/**
 * Displays summary cards with key metrics for the dashboard
 * Uses the Dashboard context instead of props
 */
const SummarySection: React.FC = () => {
  const { dashboardData, displayCurrency, activeTab, setActiveTab } =
    useDashboardContext();

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
    // Get the filtered transactions inside the useMemo to avoid dependency warnings
    const filteredTransactions = dashboardData?.filteredTransactions || [];

    if (!filteredTransactions.length) return 0;

    return filteredTransactions.reduce(
      (count, tx) => ((tx.reimbursementAmount || 0) > 0 ? count + 1 : count),
      0
    );
  }, [dashboardData]);

  // Calculate net expenses (total expenses minus reimbursements)
  const netExpenses =
    (metrics?.totalExpenses || 0) - (metrics?.totalReimbursed || 0);

  // Handle tab change
  const handleTabChange = React.useCallback(
    (value: string) => {
      setActiveTab(value as TimeframeTab);
    },
    [setActiveTab]
  );

  // Log metrics for debugging
  React.useEffect(() => {
    console.log("SummarySection metrics:", {
      totalExpenses: metrics?.totalExpenses,
      totalReimbursed: metrics?.totalReimbursed,
      netExpenses,
      percentageChange: metrics?.percentageChange
    });
  }, [metrics, netExpenses]);

  return (
    <div className="space-y-4 w-full">
      <Tabs
        defaultValue={activeTab || "thisMonth"}
        value={activeTab || "thisMonth"}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Always render content regardless of tab selection */}
        <TabsContent
          value={activeTab || "thisMonth"}
          className="mt-4 space-y-4 animate-fadeIn"
          forceMount
        >
          {/* Summary Cards - Removed specified cards and rearranged grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Net Expenses Card */}
            <SummaryCard
              title="Net Expenses"
              icon={<BarChartIcon className="h-5 w-5 text-primary" />}
              value={formatCurrency(netExpenses)}
              trend={metrics?.percentageChange !== undefined ? metrics.percentageChange : 0}
              cardColor="bg-gradient-to-br from-violet-500/10 to-purple-600/10"
              valueColor="text-violet-800 dark:text-violet-300"
            />

            {/* Reimbursements Card */}
            <SummaryCard
              title="Reimbursements"
              icon={<ArrowDownLeftIcon className="h-5 w-5 text-primary" />}
              value={formatCurrency(metrics?.totalReimbursed || 0)}
              description={`From ${reimbursedTransactionsCount} transactions`}
              cardColor="bg-gradient-to-br from-green-500/10 to-emerald-600/10"
              valueColor="text-green-800 dark:text-green-300"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(SummarySection);
