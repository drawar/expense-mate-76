// src/components/dashboard/SummarySection.tsx
import React, { useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Currency } from '@/types';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from '@/utils/formatting';
import DisplayCurrencySelect from './DisplayCurrencySelect';
import StatementCycleFilter from './StatementCycleFilter';
import { TimeframeTab } from '@/utils/transactionProcessor';
import { DashboardData } from '@/types/dashboardTypes';
import SummaryCard from './SummaryCard';
import { BarChartIcon, ReceiptIcon, CreditCardIcon, CoinsIcon } from 'lucide-react';

interface SummarySectionProps {
  dashboardData: DashboardData;
  displayCurrency: Currency;
  setDisplayCurrency: (currency: Currency) => void;
  activeTab: TimeframeTab;
  setActiveTab: (tab: TimeframeTab) => void;
  useStatementMonth: boolean;
  setUseStatementMonth: (use: boolean) => void;
  statementCycleDay: number;
  setStatementCycleDay: (day: number) => void;
}

const SummarySection: React.FC<SummarySectionProps> = ({
  dashboardData,
  displayCurrency,
  setDisplayCurrency,
  activeTab,
  setActiveTab,
  useStatementMonth,
  setUseStatementMonth,
  statementCycleDay,
  setStatementCycleDay,
}) => {
  // Memoize handlers to prevent unnecessary re-renders
  const handleCurrencyChange = useCallback((currency: Currency) => {
    setDisplayCurrency(currency);
  }, [setDisplayCurrency]);
  
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as TimeframeTab);
  }, [setActiveTab]);
  
  // Destructure metrics for easier access
  const { metrics, top, filteredTransactions } = dashboardData;

  return (
    <div className="space-y-4 w-full">
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Dashboard header with filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
            Expense Summary
          </h2>
          
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
            {/* Currency Selector */}
            <DisplayCurrencySelect 
              value={displayCurrency} 
              onChange={handleCurrencyChange}
              className="component-hover-box"
            />
            
            {/* Time Frame Selector */}
            <div className="component-hover-box">
              <Filter className="h-5 w-5 text-muted-foreground mr-2" />
              <Select
                value={activeTab}
                onValueChange={handleTabChange}
              >
                <SelectTrigger className="w-[120px] h-7 text-sm bg-transparent border-none">
                  <SelectValue placeholder="This Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="lastThreeMonths">Last 3 Months</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Statement Month toggle */}
            <StatementCycleFilter
              useStatementMonth={useStatementMonth}
              setUseStatementMonth={setUseStatementMonth}
              statementCycleDay={statementCycleDay}
              setStatementCycleDay={setStatementCycleDay}
              className="component-hover-box"
            />
          </div>
        </div>
        
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
              value={formatCurrency(metrics.totalExpenses, displayCurrency)}
              trend={metrics.percentageChange}
              cardColor="bg-gradient-to-br from-violet-500/10 to-purple-600/10"
              valueColor="text-violet-800 dark:text-violet-300"
            />
            
            {/* Transactions Card */}
            <SummaryCard
              title="Transactions"
              icon={<ReceiptIcon className="h-5 w-5 text-primary" />}
              value={metrics.transactionCount.toString()}
              description={`Avg ${formatCurrency(metrics.averageAmount, displayCurrency)} per transaction`}
              cardColor="bg-gradient-to-br from-blue-500/10 to-indigo-600/10"
              valueColor="text-blue-800 dark:text-blue-300"
            />
            
            {/* Top Payment Method Card */}
            <SummaryCard
              title="Top Payment Method"
              icon={<CreditCardIcon className="h-5 w-5 text-primary" />}
              value={top.paymentMethod?.name || "N/A"}
              description={top.paymentMethod 
                ? `${formatCurrency(top.paymentMethod.value, displayCurrency)} spent` 
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
