// src/components/dashboard/InsightsGrid.tsx
import React, { useMemo } from 'react';
import { PaymentMethod, Currency } from '@/types';
import { DashboardData } from '@/types/dashboardTypes';
import PaymentMethodCard from '@/components/dashboard/cards/PaymentMethodCard';
import SpendingCategoryCard from '@/components/dashboard/cards/SpendingCategoryCard';
import SpendingTrendCard from '@/components/dashboard/cards/SpendingTrendCard';
import CardOptimizationCard from '@/components/dashboard/cards/CardOptimizationCard';
import SavingsPotentialCard from '@/components/dashboard/cards/SavingsPotentialCard';
import UnusualSpendingCard from '@/components/dashboard/cards/UnusualSpendingCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface InsightsGridProps {
  dashboardData: DashboardData;
  paymentMethods: PaymentMethod[];
  displayCurrency: Currency;
}

/**
 * Grid component that displays financial insights using domain-specific cards
 * Organizes visualization components in a responsive layout
 * Now includes the UnusualSpendingCard component
 */
const InsightsGrid: React.FC<InsightsGridProps> = ({
  dashboardData,
  paymentMethods,
  displayCurrency,
}) => {
  // Ensure dashboardData is defined before destructuring (defensive programming)
  const filteredTransactions = dashboardData?.filteredTransactions || [];
  const charts = dashboardData?.charts || { paymentMethods: [], categories: [] };
  
  // Early return if no data to prevent rendering empty charts
  const hasData = filteredTransactions.length > 0;
  
  // Use media query hook at the top level following React Rules of Hooks
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Memoize common class to prevent recreation on every render
  const commonCardClass = useMemo(() => 
    'rounded-xl border border-border/50 bg-card hover:shadow-md transition-all',
    []
  );
  
  // Memoize props objects for each card to prevent unnecessary re-renders
  const paymentMethodCardProps = useMemo(() => ({
    data: charts.paymentMethods,
    currency: displayCurrency,
    className: commonCardClass,
    highlightTopMethod: true
  }), [charts.paymentMethods, displayCurrency, commonCardClass]);
  
  const categoryCardProps = useMemo(() => ({
    data: charts.categories,
    currency: displayCurrency,
    className: commonCardClass,
    maxCategories: 7
  }), [charts.categories, displayCurrency, commonCardClass]);
  
  const trendCardProps = useMemo(() => ({
    transactions: filteredTransactions,
    currency: displayCurrency,
    className: commonCardClass,
    initialPeriod: 'month' as 'week' | 'month' | 'quarter' | 'year'
  }), [filteredTransactions, displayCurrency, commonCardClass]);
  
  const unusualCardProps = useMemo(() => ({
    transactions: filteredTransactions,
    currency: displayCurrency,
    className: commonCardClass,
    maxDisplayedAnomalies: isMobile ? 2 : 3
  }), [filteredTransactions, displayCurrency, commonCardClass, isMobile]);
  
  const optimizationCardProps = useMemo(() => ({
    title: "Card Optimization",
    transactions: filteredTransactions,
    paymentMethods,
    currency: displayCurrency,
    className: commonCardClass
  }), [filteredTransactions, paymentMethods, displayCurrency, commonCardClass]);
  
  const savingsCardProps = useMemo(() => ({
    title: "Savings Potential",
    transactions: filteredTransactions,
    savingsGoalPercentage: 20,
    currency: displayCurrency,
    className: commonCardClass
  }), [filteredTransactions, displayCurrency, commonCardClass]);
  
  // Early return for empty data state
  if (!hasData) {
    return (
      <div className="my-6 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
          Financial Insights
        </h2>
        <div className="p-6 text-center text-muted-foreground border border-dashed rounded-xl">
          <p>Add transactions to see financial insights and visualizations.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="my-6 space-y-6">
      <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
        Financial Insights
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Methods Card - using memoized props */}
        <PaymentMethodCard {...paymentMethodCardProps} />
        
        {/* Expense Categories Card - using memoized props */}
        <SpendingCategoryCard {...categoryCardProps} />
        
        {/* Spending Trends Card - using memoized props */}
        <SpendingTrendCard {...trendCardProps} />
        
        {/* Unusual Spending Card - using memoized props */}
        <UnusualSpendingCard {...unusualCardProps} />
        
        {/* Container for optimization cards - using memoized layout class */}
        <div className={`grid grid-cols-1 gap-4 ${isMobile ? '' : 'col-span-2'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Optimization Card - using memoized props */}
            <CardOptimizationCard {...optimizationCardProps} />
            
            {/* Savings Potential Card - using memoized props */}
            <SavingsPotentialCard {...savingsCardProps} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default React.memo(InsightsGrid);
