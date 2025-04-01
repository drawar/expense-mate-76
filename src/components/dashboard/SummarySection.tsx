
// src/components/dashboard/SummarySection.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardData } from '@/types/dashboardTypes';
import SummaryCard from './SummaryCard';
import { BarChartIcon, ReceiptIcon, CreditCardIcon, CoinsIcon } from 'lucide-react';
import { Currency } from '@/types';
import { useCurrencyFormatter } from '@/hooks/useCurrencyFormatter';

/**
 * Props for SummarySection component
 */
interface SummarySectionProps {
  dashboardData: DashboardData;
  displayCurrency: Currency;
  activeTab: string;
  onTabChange?: (value: string) => void;
}

/**
 * Displays summary cards with key metrics for the dashboard
 * No longer contains filter controls (moved to FilterBar)
 * Optimized to use currency formatting hook
 */
const SummarySection: React.FC<SummarySectionProps> = ({
  dashboardData,
  displayCurrency,
  activeTab,
  onTabChange
}) => {
  // Ensure we have valid data structure to prevent errors
  const metrics = dashboardData?.metrics || {
    totalExpenses: 0,
    transactionCount: 0,
    averageAmount: 0,
    totalRewardPoints: 0,
    percentageChange: 0,
  };
  
  const top = dashboardData?.top || {};
  const filteredTransactions = dashboardData?.filteredTransactions || [];
  
  // Use the custom currency formatter hook
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Calculate count of transactions with reward points
  const rewardPointTransactionsCount = React.useMemo(() => {
    if (!filteredTransactions.length) return 0;
    
    // More efficient than filter().length as it avoids creating a new array
    return filteredTransactions.reduce((count, tx) => 
      (tx.rewardPoints || 0) > 0 ? count + 1 : count, 0);
  }, [filteredTransactions]);

  // Handle tab change if provided
  const handleTabChange = React.useCallback((value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  }, [onTabChange]);

  // For debugging - log values to see what's happening
  console.log('SummarySection rendering with:', {
    activeTab,
    metricsExist: !!metrics,
    totalExpenses: metrics?.totalExpenses,
    transactionCount: metrics?.transactionCount,
    filteredTransactionsCount: filteredTransactions?.length
  });

  return (
    <div className="space-y-4 w-full">
      <Tabs 
        defaultValue={activeTab || 'thisMonth'}
        value={activeTab || 'thisMonth'}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Always render content regardless of tab selection */}
        <TabsContent 
          value={activeTab || 'thisMonth'} 
          className="mt-4 space-y-4 animate-fadeIn"
          forceMount
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Expenses Card */}
            <SummaryCard
              title="Total Expenses"
              icon={<BarChartIcon className="h-5 w-5 text-primary" />}
              value={formatCurrency(metrics?.totalExpenses || 0)}
              trend={metrics?.percentageChange || 0}
              cardColor="bg-gradient-to-br from-violet-500/10 to-purple-600/10"
              valueColor="text-violet-800 dark:text-violet-300"
            />
            
            {/* Transactions Card */}
            <SummaryCard
              title="Transactions"
              icon={<ReceiptIcon className="h-5 w-5 text-primary" />}
              value={(metrics?.transactionCount || 0).toString()}
              description={`Avg ${formatCurrency(metrics?.averageAmount || 0)} per transaction`}
              cardColor="bg-gradient-to-br from-blue-500/10 to-indigo-600/10"
              valueColor="text-blue-800 dark:text-blue-300"
            />
            
            {/* Top Payment Method Card */}
            <SummaryCard
              title="Top Payment Method"
              icon={<CreditCardIcon className="h-5 w-5 text-primary" />}
              value={top?.paymentMethod?.name || "N/A"}
              description={top?.paymentMethod 
                ? `${formatCurrency(top.paymentMethod.value || 0)} spent` 
                : "No data"}
              cardColor="bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10"
              valueColor="text-fuchsia-800 dark:text-fuchsia-300"
            />
            
            {/* Reward Points Card */}
            <SummaryCard
              title="Reward Points"
              icon={<CoinsIcon className="h-5 w-5 text-primary" />}
              value={(metrics?.totalRewardPoints || 0).toLocaleString()}
              description={`From ${rewardPointTransactionsCount} transactions`}
              cardColor="bg-gradient-to-br from-amber-500/10 to-orange-600/10"
              valueColor="text-amber-800 dark:text-amber-300"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(SummarySection);
