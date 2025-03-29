// src/components/dashboard/Dashboard.tsx
import React, { useMemo } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SummarySection from '@/components/dashboard/SummarySection';
import InsightsGrid from '@/components/dashboard/InsightsGrid';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import LoadingDashboard from '@/components/dashboard/LoadingDashboard';
import FilterBar from '@/components/dashboard/FilterBar';
import { useDashboard } from '@/hooks/useDashboard';
import { useDashboardFilters } from '@/hooks/useDashboardFilters';
import { TimeframeTab } from '@/utils/transactionProcessor';

interface DashboardProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  defaultCurrency?: Currency;
}

/**
 * Main dashboard component that displays financial data and insights
 * Now uses a separate FilterBar component for global filters
 */
const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  paymentMethods,
  loading,
  defaultCurrency = 'SGD'
}) => {
  // Use our custom filter hook to manage all filter state
  const filters = useDashboardFilters(defaultCurrency);
  
  // Use the dashboard data hook with our filters
  const dashboardData = useDashboard({
    transactions,
    displayCurrency: filters.displayCurrency,
    timeframe: filters.activeTab,
    useStatementMonth: filters.useStatementMonth,
    statementCycleDay: filters.statementCycleDay,
    calculateDayOfWeekMetrics: true
  });
  
  // Memoize recent transactions to avoid unnecessary processing
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);
  
  // Early return for loading state
  if (loading) {
    return <LoadingDashboard />;
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
          
          {/* Global Filter Bar - moved from SummarySection */}
          <FilterBar filters={filters} />
        </div>
        
        {/* Summary Section - now without filters */}
        <SummarySection 
          dashboardData={dashboardData}
          displayCurrency={filters.displayCurrency}
          activeTab={filters.activeTab}
          onTabChange={filters.handleTimeframeChange}
        />
        
        {/* Insights Grid - with filtered data */}
        <InsightsGrid 
          dashboardData={dashboardData}
          paymentMethods={paymentMethods}
          displayCurrency={filters.displayCurrency}
        />
        
        {/* Recent Transactions */}
        <RecentTransactions 
          transactions={recentTransactions}
        />
      </div>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(Dashboard);
