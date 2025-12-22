// components/dashboard/Dashboard.tsx
import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import {
  DashboardHeader,
  SummarySection,
  InsightsGrid,
  RecentTransactions,
  EmptyState,
  LoadingDashboard,
} from "./layout";
import { FilterBar } from "./filters";
import { PieChartIcon } from "lucide-react";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import FAB from "@/components/common/FAB";
import PullToRefresh from "@/components/common/PullToRefresh";
import { TimeframeTab } from "@/utils/dashboard";
import { Currency } from "@/types";
import { useBudget } from "@/hooks/useBudget";

/**
 * Main dashboard component - the entry point for the dashboard UI
 */
export function Dashboard() {
  // Get all dashboard data from context
  const {
    transactions,
    filteredTransactions,
    paymentMethods,
    dashboardData,
    isLoading,
    error,
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    setActiveTab,
    setDisplayCurrency,
    setUseStatementMonth,
    setStatementCycleDay,
    refreshData,
  } = useDashboardContext();

  // Get monthly budget for current currency
  const { monthlyBudget } = useBudget(displayCurrency);

  // Get recent transactions for display
  const recentTransactions = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    return transactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Combine filter state for FilterBar
  const filterState = {
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    handleTimeframeChange: (value: string) =>
      setActiveTab(value as TimeframeTab),
    handleCurrencyChange: (currency: Currency) => setDisplayCurrency(currency),
    handleStatementMonthToggle: (value: boolean) => setUseStatementMonth(value),
    handleStatementCycleDayChange: (day: number) => setStatementCycleDay(day),
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen">
        <div className="container max-w-7xl mx-auto pb-8 md:pb-16 px-4 md:px-6">
          <DashboardHeader />
          <div className="mt-10 border border-dashed rounded-xl">
            <EmptyState
              title="Error Loading Dashboard"
              description={error}
              icon={
                <PieChartIcon className="h-16 w-16 text-muted-foreground" />
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // Loading state - use shimmer skeleton
  if (isLoading) {
    return <LoadingDashboard />;
  }

  // No transactions state
  if (filteredTransactions.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container max-w-7xl mx-auto pb-8 md:pb-16 px-4 md:px-6">
          <DashboardHeader />
          <div className="mt-10 border border-dashed rounded-xl">
            <EmptyState
              title="No Transactions Found"
              description="Add your first transaction to start tracking your expenses."
              icon={
                <PieChartIcon className="h-16 w-16 text-muted-foreground" />
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refreshData} className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-8 md:pb-16 px-4 md:px-6">
        <DashboardHeader />

        {/* Global Filter Bar */}
        <FilterBar filters={filterState} className="mb-6" />

        <ErrorBoundary>
          {/* Summary Section */}
          <SummarySection />

          {/* Insights Grid - 24px margin top for section spacing */}
          <InsightsGrid
            dashboardData={dashboardData}
            paymentMethods={paymentMethods}
            currency={displayCurrency}
            monthlyBudget={monthlyBudget}
          />

          {/* Recent Transactions */}
          <RecentTransactions
            transactions={recentTransactions}
            allTransactions={transactions}
            displayCurrency={displayCurrency}
          />
        </ErrorBoundary>

        {/* Floating Action Button */}
        <FAB to="/add-expense" label="Add Expense" />
      </div>
    </PullToRefresh>
  );
}

export default React.memo(Dashboard);
