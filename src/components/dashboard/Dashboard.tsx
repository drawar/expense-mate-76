// components/dashboard/Dashboard.tsx
import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import {
  DashboardHeader,
  SummarySection,
  InsightsGrid,
  RecentTransactions,
  EmptyState,
} from "./layout";
import { FilterBar } from "./filters";
import { PieChartIcon } from "lucide-react";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { TimeframeTab } from "@/utils/dashboard";
import { Currency } from "@/types";

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
  } = useDashboardContext();

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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container max-w-7xl mx-auto pb-8 md:pb-16 px-4 md:px-6">
          <DashboardHeader />
          <div className="animate-pulse space-y-6 mt-10">
            <div className="h-28 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64 bg-muted rounded-xl" />
              <div className="h-64 bg-muted rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
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
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto pb-8 md:pb-16 px-4 md:px-6">
        <DashboardHeader />

        {/* Dashboard Title and Global Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#00A651] to-[#10B981]">
            Expense Summary
          </h2>

          {/* Global Filter Bar */}
          <FilterBar filters={filterState} />
        </div>

        <ErrorBoundary>
          {/* Summary Section */}
          <SummarySection />

          {/* Insights Grid */}
          <InsightsGrid
            dashboardData={dashboardData}
            paymentMethods={paymentMethods}
            currency={displayCurrency}
          />

          {/* Recent Transactions */}
          <RecentTransactions
            transactions={recentTransactions}
            allTransactions={transactions}
            displayCurrency={displayCurrency}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default React.memo(Dashboard);
