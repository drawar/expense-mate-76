// src/components/dashboard/InsightsGrid.tsx
import React from 'react';
import { PaymentMethod, Currency } from '@/types';
import { DashboardData } from '@/types/dashboardTypes';
import PaymentMethodCard from '@/components/dashboard/cards/PaymentMethodCard';
import CategoryCard from '@/components/dashboard/cards/CategoryCard';
import SpendingTrendsCard from '@/components/dashboard/cards/SpendingTrendsCard';
import CardOptimizationCard from '@/components/dashboard/cards/CardOptimizationCard';
import SavingsPotentialCard from '@/components/dashboard/cards/SavingsPotentialCard';

interface InsightsGridProps {
  dashboardData: DashboardData;
  paymentMethods: PaymentMethod[];
  displayCurrency: Currency;
  isMobile: boolean;
}

const InsightsGrid: React.FC<InsightsGridProps> = ({
  dashboardData,
  paymentMethods,
  displayCurrency,
  isMobile
}) => {
  const { filteredTransactions, charts } = dashboardData;
  
  // Define a common class for all cards
  const commonCardClass = 'rounded-xl border border-border/50 bg-card hover:shadow-md transition-all';
  
  return (
    <div className="my-6 space-y-6">
      <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
        Financial Insights
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Methods Chart */}
        <PaymentMethodCard
          title="Payment Methods"
          paymentMethodData={charts.paymentMethods}
          currency={displayCurrency}
          className={commonCardClass}
        />
        
        {/* Expense Categories Chart */}
        <CategoryCard
          title="Expense Categories"
          categoryData={charts.categories}
          currency={displayCurrency}
          className={commonCardClass}
        />
        
        {/* Spending Trends */}
        <SpendingTrendsCard
          title="Spending Trends"
          transactions={filteredTransactions}
          period="month"
          showAverage={true}
          showInsights={true}
          currency={displayCurrency}
          className={commonCardClass}
        />
        
        {/* This grid spans 2 columns on mobile, 1 column on desktop */}
        <div className="grid grid-cols-1 gap-4">
          {/* Card Optimization */}
          <CardOptimizationCard
            title="Card Optimization"
            transactions={filteredTransactions}
            paymentMethods={paymentMethods}
            currency={displayCurrency}
            className={commonCardClass}
          />
          
          {/* Savings Potential */}
          <SavingsPotentialCard
            title="Savings Potential"
            transactions={filteredTransactions}
            savingsGoalPercentage={20}
            currency={displayCurrency}
            className={commonCardClass}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(InsightsGrid);
