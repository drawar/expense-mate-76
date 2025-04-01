
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
  lastUpdate?: number; // Add timestamp for forcing updates
}

/**
 * Main dashboard component that displays financial data and insights
 * Now uses a separate FilterBar component for global filters
 */
const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  paymentMethods,
  loading,
  defaultCurrency = 'SGD',
  lastUpdate
}) => {
  // Use our custom filter hook to manage all filter state
  const filters = useDashboardFilters(defaultCurrency);
  
  // Early optimization - avoid calculations for empty arrays
  const hasTransactions = transactions.length > 0;
  
  // Memoize filter options object to prevent unnecessary hook calls
  const dashboardOptions = useMemo(() => ({
    transactions,
    displayCurrency: filters.displayCurrency,
    timeframe: filters.activeTab as TimeframeTab,
    useStatementMonth: filters.useStatementMonth,
    statementCycleDay: filters.statementCycleDay,
    calculateDayOfWeekMetrics: hasTransactions, // Only calculate when we have data
    lastUpdate // Pass through the update timestamp
  }), [
    transactions, 
    filters.displayCurrency, 
    filters.activeTab, 
    filters.useStatementMonth, 
    filters.statementCycleDay,
    hasTransactions,
    lastUpdate // Add as dependency to refresh calculations
  ]);
  
  // Use the dashboard data hook with our memoized options
  const dashboardData = useDashboard(dashboardOptions);
  
  // Ensure we always have valid dashboard data structure even when filtering returns no data
  const safeDashboardData = useMemo(() => {
    // Default/fallback data when no results are available
    const defaultData = {
      filteredTransactions: [],
      metrics: {
        totalExpenses: 0,
        transactionCount: 0,
        averageAmount: 0,
        totalRewardPoints: 0,
        percentageChange: 0,
        hasEnoughData: false,
      },
      top: {},
      charts: {
        paymentMethods: [],
        categories: [],
        spendingTrends: { labels: [], datasets: [] }
      }
    };
    
    // If dashboardData is null or undefined, return the default data
    return dashboardData || defaultData;
  }, [dashboardData]);
  
  // More efficient recent transactions calculation
  // Finds 5 most recent without sorting the entire array
  const recentTransactions = useMemo(() => {
    if (!hasTransactions) return [];
    
    // Use a more efficient approach by maintaining a top-5 array
    return transactions.reduce((recent, transaction) => {
      const txDate = new Date(transaction.date).getTime();
      
      // If we have fewer than 5 items, simply add the new one
      if (recent.length < 5) {
        recent.push(transaction);
        // Sort only when needed
        if (recent.length === 5) {
          recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return recent;
      }
      
      // Check if this transaction is more recent than the oldest in our array
      const oldestDate = new Date(recent[recent.length - 1].date).getTime();
      if (txDate > oldestDate) {
        // Replace the oldest and re-sort
        recent.pop();
        recent.push(transaction);
        recent.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      
      return recent;
    }, [] as Transaction[]);
  }, [transactions, hasTransactions]);
  
  // Early return for loading state
  if (loading) {
    return <LoadingDashboard />;
  }

  // Add debug logging to help identify issues
  console.log('Dashboard rendering with:', {
    timeframe: filters.activeTab,
    hasData: !!safeDashboardData,
    filteredTransactionCount: safeDashboardData.filteredTransactions?.length || 0,
    metrics: safeDashboardData.metrics
  });
  
  // Ensure activeTab is defined and valid for the SummarySection
  const ensuredActiveTab = filters.activeTab || 'thisMonth';
  
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
          dashboardData={safeDashboardData}
          displayCurrency={filters.displayCurrency}
          activeTab={ensuredActiveTab}
          onTabChange={filters.handleTimeframeChange}
        />
        
        {/* Insights Grid - with filtered data */}
        <InsightsGrid 
          dashboardData={safeDashboardData}
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
