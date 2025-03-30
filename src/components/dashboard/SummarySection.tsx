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
  // Destructure metrics for easier access
  const { metrics, top, filteredTransactions } = dashboardData;
  
  // Use the custom currency formatter hook
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  // Handle tab change if provided
  const handleTabChange = (value: string) => {
    if (onTabChange) {
      onTabChange(value);
    }
  };
  
  console.log("SummarySection rendering");

  return (
    <div className="space-y-4 w-full">
      <Tabs 
        defaultValue={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Main content area */}
        <TabsContent 
          value={activeTab} 
          className="mt-4 space-y-4 animate-fadeIn"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Expenses Card */}
            <SummaryCard
              title="Total Expenses"
              icon={<BarChartIcon className="h-5 w-5 text-primary" />}
              value={formatCurrency(metrics.totalExpenses)}
              trend={metrics.percentageChange}
              cardColor="bg-gradient-to-br from-violet-500/10 to-purple-600/10"
              valueColor="text-violet-800 dark:text-violet-300"
            />
            
            {/* Transactions Card */}
            <SummaryCard
              title="Transactions"
              icon={<ReceiptIcon className="h-5 w-5 text-primary" />}
              value={metrics.transactionCount.toString()}
              description={`Avg ${formatCurrency(metrics.averageAmount)} per transaction`}
              cardColor="bg-gradient-to-br from-blue-500/10 to-indigo-600/10"
              valueColor="text-blue-800 dark:text-blue-300"
            />
            
            {/* Top Payment Method Card */}
            <SummaryCard
              title="Top Payment Method"
              icon={<CreditCardIcon className="h-5 w-5 text-primary" />}
              value={top.paymentMethod?.name || "N/A"}
              description={top.paymentMethod 
                ? `${formatCurrency(top.paymentMethod.value)} spent` 
                : "No data"}
              cardColor="bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10"
              valueColor="text-fuchsia-800 dark:text-fuchsia-300"
            />
            
            {/* Reward Points Card */}
            <SummaryCard
              title="Reward Points"
              icon={<CoinsIcon className="h-5 w-5 text-primary" />}
              value={metrics.totalRewardPoints.toLocaleString()}
              description={`From ${filteredTransactions.filter(tx => (tx.rewardPoints || 0) > 0).length} transactions`}
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
