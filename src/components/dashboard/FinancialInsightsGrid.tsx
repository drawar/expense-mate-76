// src/components/dashboard/FinancialInsightsGrid.tsx
import React, { Component } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { SummaryData } from '@/utils/SummaryDataProcessor';
import { createPaymentMethodCard } from '@/components/dashboard/cards/PaymentMethodCard';
import { createCategoryCard } from '@/components/dashboard/cards/CategoryCard';
import { createSpendingTrendsCard } from '@/components/dashboard/cards/SpendingTrendsCard';
import { createCardOptimizationCard } from '@/components/dashboard/cards/CardOptimizationCard';
import { createSavingsPotentialCard } from '@/components/dashboard/cards/SavingsPotentialCard';
import { PieChartCard } from '@/components/dashboard/abstractions/AbstractPieChart'; // Using the direct PieChartCard class
import { TagIcon } from 'lucide-react';

interface FinancialInsightsGridProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  summaryData: SummaryData;
  categoryChartData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  currency?: Currency;
}

const DEFAULT_CURRENCY: Currency = 'SGD'; 
/**
 * Component that displays the grid of financial insights cards
 * Implements the Composite pattern by composing multiple child components
 */
class FinancialInsightsGrid extends Component<FinancialInsightsGridProps> {
  render() {
    const { 
      transactions, 
      paymentMethods, 
      summaryData, 
      categoryChartData,
      currency
    } = this.props;
    
    const commonClasses = "rounded-xl border border-border/50 bg-card hover:shadow-md transition-all";
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
        {/* Payment Methods Chart */}
        {createPaymentMethodCard(
          summaryData.paymentMethodChartData,
          DEFAULT_CURRENCY,
          commonClasses
        )}
        
        {/* Expense Categories Chart */}
        {createCategoryCard(
          summaryData.categoryChartData,
          DEFAULT_CURRENCY,
          commonClasses
        )}
        
        {/* Spending Trends */}
        {createSpendingTrendsCard(
          transactions,
          'month',
          true,
          true,
          DEFAULT_CURRENCY,
          commonClasses
        )}
        
        {/* Card Optimization */}
        {createCardOptimizationCard(
          transactions,
          paymentMethods,
          DEFAULT_CURRENCY,
          commonClasses
        )}
        
        {/* Savings Potential */}
        {createSavingsPotentialCard(
          transactions,
          20,
          DEFAULT_CURRENCY,
          commonClasses
        )}
        
        {/* Category Analysis - Using PieChartCard directly */}
        <PieChartCard
          title="Category Analysis"
          data={categoryChartData}
          currency={currency}
          className={commonClasses}
        />
      </div>
    );
  }
}

export default FinancialInsightsGrid;
