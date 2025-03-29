// src/components/dashboard/InsightsGrid.tsx
import React from 'react';
import { PaymentMethod, Currency } from '@/types';
import { DashboardData } from '@/types/dashboardTypes';
import PaymentMethodCard from '@/components/dashboard/cards/PaymentMethodCard';
import SpendingCategoryCard from '@/components/dashboard/cards/SpendingCategoryCard';
import SpendingTrendCard from '@/components/dashboard/cards/SpendingTrendCard';
import CardOptimizationCard from '@/components/dashboard/cards/CardOptimizationCard';
import SavingsPotentialCard from '@/components/dashboard/cards/SavingsPotentialCard';

interface InsightsGridProps {
  dashboardData: DashboardData;
  paymentMethods: PaymentMethod[];
  displayCurrency: Currency;
}

/**
 * Grid component that displays financial insights using domain-specific cards
 * Organizes visualization components in a responsive layout
 */
const InsightsGrid: React.FC<InsightsGridProps> = ({
  dashboardData,
  paymentMethods,
  displayCurrency,
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
        {/* Payment Methods Card */}
        <PaymentMethodCard
          data={charts.paymentMethods}
          currency={displayCurrency}
          className={commonCardClass}
          highlightTopMethod={true}
        />
        
        {/* Expense Categories Card */}
        <SpendingCategoryCard
          data={charts.categories}
          currency={displayCurrency}
          className={commonCardClass}
          maxCategories={7}
        />
        
        {/* Spending Trends Card */}
        <SpendingTrendCard
          transactions={filteredTransactions}
          currency={displayCurrency}
          className={commonCardClass}
          initialPeriod="month"
        />
        
        {/* Container for optimization cards */}
        <div className="grid grid-cols-1 gap-4">
          {/* Card Optimization Card */}
          <CardOptimizationCard
            title="Card Optimization"
            transactions={filteredTransactions}
            paymentMethods={paymentMethods}
            currency={displayCurrency}
            className={commonCardClass}
          />
          
          {/* Savings Potential Card */}
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

// Use memo to prevent unnecessary re-renders
export default React.memo(InsightsGrid);
