// src/components/dashboard/Dashboard.tsx
import React, { useMemo } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SummarySection from '@/components/dashboard/SummarySection';
import InsightsGrid from '@/components/dashboard/InsightsGrid';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import LoadingDashboard from '@/components/dashboard/LoadingDashboard';
import { useDashboard } from '@/hooks/useDashboard';
import { useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { TimeframeTab } from '@/utils/transactionProcessor';

interface DashboardProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  defaultCurrency?: Currency;
}

// Memoized component to prevent unnecessary re-renders
const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  paymentMethods,
  loading,
  defaultCurrency = 'SGD'
}) => {
  // UI state for filtering 
  const [activeTab, setActiveTab] = useState<TimeframeTab>('thisMonth');
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(defaultCurrency);
  const [useStatementMonth, setUseStatementMonth] = useState(false);
  const [statementCycleDay, setStatementCycleDay] = useState(15);
  
  // Media query hook for responsive design
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Use our consolidated hook for all dashboard data processing
  const dashboardData = useDashboard({
    transactions,
    displayCurrency,
    timeframe: activeTab,
    useStatementMonth,
    statementCycleDay,
    calculateDayOfWeekMetrics: true
  });
  
  // Filter to get recent transactions only once
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);
  
  if (loading) {
    return <LoadingDashboard />;
  }
  
  return (
    <div className="min-h-screen">  
      <div className="container max-w-7xl mx-auto pb-8 md:pb-16 px-4 md:px-6">
        <DashboardHeader />
        
        <SummarySection 
          dashboardData={dashboardData}
          displayCurrency={displayCurrency}
          setDisplayCurrency={setDisplayCurrency}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          useStatementMonth={useStatementMonth}
          setUseStatementMonth={setUseStatementMonth}
          statementCycleDay={statementCycleDay}
          setStatementCycleDay={setStatementCycleDay}
          isMobile={isMobile}
        />
        
        <InsightsGrid 
          dashboardData={dashboardData}
          paymentMethods={paymentMethods}
          displayCurrency={displayCurrency}
          isMobile={isMobile}
        />
        
        <RecentTransactions 
          transactions={recentTransactions} 
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
