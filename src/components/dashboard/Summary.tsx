// src/components/dashboard/Summary.tsx
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/utils/formatting';
import DisplayCurrencySelect from './DisplayCurrencySelect';
import StatementCycleFilter from './StatementCycleFilter';
import { useDashboard, TimeframeTab } from '@/hooks/useDashboard';
import "./dashboard.css";

// Define the Card components directly here instead of importing from separate files
import { BarChartIcon, ReceiptIcon, CreditCardIcon, CoinsIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SummaryCharts from './SummaryCharts';

interface SummaryProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
}

const Summary = ({ transactions, paymentMethods }: SummaryProps) => {
  // UI state for filtering
  const [activeTab, setActiveTab] = useState<TimeframeTab>('thisMonth');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('SGD');
  const [useStatementMonth, setUseStatementMonth] = useState(false);
  const [statementCycleDay, setStatementCycleDay] = useState(15);
  
  // Use our consolidated hook for all dashboard data
  const dashboard = useDashboard({
    transactions,
    displayCurrency,
    timeframe: activeTab,
    useStatementMonth,
    statementCycleDay
  });
  
  return (
    <div className="space-y-4 w-full">
      <Tabs defaultValue={activeTab} onValueChange={(value) => setActiveTab(value as TimeframeTab)}>
        {/* Dashboard header with filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">Expense Summary</h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 items-start sm:items-center">
            {/* Currency Selector */}
            <DisplayCurrencySelect 
              value={displayCurrency} 
              onChange={setDisplayCurrency}
              className="component-hover-box currency-selector"
            />
            
            {/* Time Frame Selector */}
            <div className="component-hover-box timeframe-selector">
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
              className="component-hover-box statement-toggle"
            />
          </div>
        </div>
        
        {/* Main content area */}
        <TabsContent 
          value={activeTab} 
          className="mt-4 space-y-4"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Expenses Card */}
            <SummaryCard
              title="Total Expenses"
              icon={<BarChartIcon className="h-5 w-5 text-primary" />}
              value={formatCurrency(dashboard.metrics.totalExpenses, displayCurrency)}
              trend={dashboard.metrics.percentageChange}
              cardColor="bg-gradient-to-br from-violet-500/10 to-purple-600/10"
              valueColor="text-violet-800 dark:text-violet-300"
            />
            
            {/* Transactions Card */}
            <SummaryCard
              title="Transactions"
              icon={<ReceiptIcon className="h-5 w-5 text-primary" />}
              value={dashboard.metrics.transactionCount.toString()}
              description={`Avg ${formatCurrency(dashboard.metrics.averageAmount, displayCurrency)} per transaction`}
              cardColor="bg-gradient-to-br from-blue-500/10 to-indigo-600/10"
              valueColor="text-blue-800 dark:text-blue-300"
            />
            
            {/* Top Payment Method Card */}
            <SummaryCard
              title="Top Payment Method"
              icon={<CreditCardIcon className="h-5 w-5 text-primary" />}
              value={dashboard.top.paymentMethod?.name || "N/A"}
              description={dashboard.top.paymentMethod 
                ? `${formatCurrency(dashboard.top.paymentMethod.value, displayCurrency)} spent` 
                : "No data"}
              cardColor="bg-gradient-to-br from-fuchsia-500/10 to-pink-600/10"
              valueColor="text-fuchsia-800 dark:text-fuchsia-300"
            />
            
            {/* Reward Points Card */}
            <SummaryCard
              title="Reward Points"
              icon={<CoinsIcon className="h-5 w-5 text-primary" />}
              value={dashboard.metrics.totalRewardPoints.toLocaleString()}
              description={`From ${dashboard.transactions.filter(tx => (tx.rewardPoints || 0) > 0).length} transactions`}
              cardColor="bg-gradient-to-br from-amber-500/10 to-orange-600/10"
              valueColor="text-amber-800 dark:text-amber-300"
            />
          </div>
          
          <div className="flex justify-end">
            <Link to="/reward-points">
              <Button variant="outline" size="sm" className="flex gap-2 items-center">
                <span>View Reward Points Analytics</span>
                <ExternalLinkIcon size={16} />
              </Button>
            </Link>
          </div>
          
          {/* Charts */}
          <SummaryCharts
            paymentMethodChartData={dashboard.charts.paymentMethods}
            categoryChartData={dashboard.charts.categories}
            displayCurrency={displayCurrency}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Simple SummaryCard component included directly
interface SummaryCardProps {
  title: string;
  icon: React.ReactNode;
  value: string;
  description?: string;
  trend?: number;
  cardColor?: string;
  valueColor?: string;
}

const SummaryCard = ({ 
  title, 
  icon, 
  value, 
  description, 
  trend, 
  cardColor = "bg-card",
  valueColor = "text-foreground"
}: SummaryCardProps) => {
  // Format trend if available
  let trendDisplay = null;
  if (trend !== undefined) {
    const isTrendPositive = trend >= 0;
    const trendColor = isTrendPositive 
      ? "text-red-500 dark:text-red-400" 
      : "text-green-500 dark:text-green-400";
    const formattedTrend = `${isTrendPositive ? '+' : ''}${trend.toFixed(1)}%`;
    
    trendDisplay = (
      <span className={`flex items-center gap-1 ${trendColor}`}>
        {isTrendPositive ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 6l-9.5 9.5-5-5L1 18" />
            <path d="M17 6h6v6" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 18l-9.5-9.5-5 5L1 6" />
            <path d="M17 18h6v-6" />
          </svg>
        )}
        <span>{formattedTrend}</span>
      </span>
    );
  }

  return (
    <Card className={`summary-card overflow-hidden animate-fadeIn ${cardColor}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center">
          {icon && <span className="mr-1.5">{icon}</span>}
          {title}
        </CardTitle>
        
        <div className="mt-2">
          <div className={`text-2xl font-bold truncate ${valueColor}`} title={value}>
            {value}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          {trendDisplay || description}
        </div>
      </CardContent>
    </Card>
  );
};

export default Summary;
