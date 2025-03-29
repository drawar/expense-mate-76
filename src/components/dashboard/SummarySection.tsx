// src/components/dashboard/SummarySection.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Currency } from '@/types';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatting';
import DisplayCurrencySelect from './DisplayCurrencySelect';
import StatementCycleFilter from './StatementCycleFilter';
import { TimeframeTab } from '@/utils/transactionProcessor';
import SummaryCharts from './SummaryCharts';
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
  isMobile: boolean;
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
  isMobile
}) => {
  const handleCurrencyChange = (currency: Currency) => {
    setDisplayCurrency(currency);
  };
  
  return (
    <div className="space-y-4 w-full">
      <Tabs 
        defaultValue={activeTab} 
        onValueChange={(value) => setActiveTab(value as TimeframeTab)}
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
                onValueChange={(value) => setActiveTab(value as TimeframeTab)}
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
              value={formatCurrency(dashboardData.metrics.totalExpenses, displayCurrency)}
              trend={dashboardData.metrics.percentageChange}
              cardColor="bg-gradient-to-br from-violet-500/10 to-purple-600/10"
              valueColor="text-violet-800 dark:text-violet-300"
            />
            
            {/* Transactions Card */}
            <SummaryCard
              title="Transactions"
              icon={<ReceiptIcon className="h-5 w-5 text-primary" />}
              value={dashboardData.metrics.transactionCount.toString()}
              description={`Avg ${formatCurrency(dashboardData.metrics.averageAmount, displayCurrency)} per transaction`}
              cardColor="bg-gradient-to-br from-blue-500/10 to-indigo-600/10"
              valueColor="text-blue-800 dark:text-blue-300"
            />
            
            {/* Top Payment Method Card */}
            <SummaryCard
              title="Top Payment Method"
              icon={<CreditCardIcon className="h-5 w-5 text-primary" />}
              value={dashboardData.top.paymentMethod?.name || "N/A"}
              description={dashboardData.top.paymentMethod 
                ? `${formatCurrency(dashboardData.top.paymentMethod.value, displayCurrency)} spent` 
                : "No data"}
              cardColor="bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10"
              valueColor="text-fuchsia-800 dark:text-fuchsia-300"
            />
            
            {/* Reward Points Card */}
            <SummaryCard
              title="Reward Points"
              icon={<CoinsIcon className="h-5 w-5 text-primary" />}
              value={dashboardData.metrics.totalRewardPoints.toLocaleString()}
              description={`From ${dashboardData.filteredTransactions.filter(tx => (tx.rewardPoints || 0) > 0).length} transactions`}
              cardColor="bg-gradient-to-br from-amber-500/10 to-orange-600/10"
              valueColor="text-amber-800 dark:text-amber-300"
            />
          </div>
          
          {/* <div className="flex justify-end">
            <Link to="/reward-points">
              <Button variant="outline" size="sm" className="flex gap-2 items-center">
                <span>View Reward Points Analytics</span>
                <ExternalLinkIcon size={16} />
              </Button>
            </Link>
          </div> */}
          
          {/* Charts */}
          {/* <SummaryCharts
            paymentMethodChartData={dashboardData.charts.paymentMethods}
            categoryChartData={dashboardData.charts.categories}
            displayCurrency={displayCurrency}
          /> */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default React.memo(SummarySection);
