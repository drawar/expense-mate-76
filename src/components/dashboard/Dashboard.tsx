// src/components/dashboard/Dashboard.tsx
import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SummarySection from "@/components/dashboard/SummarySection";
import InsightsGrid from "@/components/dashboard/InsightsGrid";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import LoadingDashboard from "@/components/dashboard/LoadingDashboard";
import FilterBar from "@/components/dashboard/FilterBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PieChartIcon } from "lucide-react";

export function Dashboard() {
  const {
    transactions,
    dashboardData,
    isLoading,
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    setActiveTab,
    setDisplayCurrency,
    setUseStatementMonth,
    setStatementCycleDay,
  } = useDashboardContext();

  // Always declare Hooks unconditionally at the top level
  // This memo will return an empty array if there are no transactions
  const recentTransactions = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    return transactions
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Filter state grouped for FilterBar
  const filterState = {
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    handleTimeframeChange: setActiveTab,
    handleCurrencyChange: setDisplayCurrency,
    handleStatementMonthToggle: setUseStatementMonth,
    handleStatementCycleDayChange: setStatementCycleDay,
  };

  // Early return for loading state
  if (isLoading) {
    return <LoadingDashboard />;
  }

  // No transactions state
  if (transactions.length === 0) {
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
          <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
            Expense Summary
          </h2>

          {/* Global Filter Bar */}
          <FilterBar filters={filterState} />
        </div>

        {/* Summary Section */}
        <SummarySection />

        {/* Insights Grid */}
        <InsightsGrid />

        {/* Recent Transactions */}
        <RecentTransactions transactions={recentTransactions} />
      </div>
    </div>
  );
}

export default React.memo(Dashboard);
