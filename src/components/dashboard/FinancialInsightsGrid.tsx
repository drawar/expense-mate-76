import React, { Component } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { SummaryData } from '@/utils/SummaryDataProcessor';
import { createPaymentMethodCard } from '@/components/dashboard/cards/PaymentMethodCard';
import { createCategoryCard } from '@/components/dashboard/cards/CategoryCard';
import { createSpendingTrendsCard } from '@/components/dashboard/cards/SpendingTrendsCard';
import { createCardOptimizationCard } from '@/components/dashboard/cards/CardOptimizationCard';
import { createSavingsPotentialCard } from '@/components/dashboard/cards/SavingsPotentialCard';
import { PieChartDataItem } from '@/components/dashboard/abstractions/AbstractPieChart';
import { TagIcon } from 'lucide-react';

interface FinancialInsightsGridProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  summaryData: SummaryData;
  categoryChartData: PieChartDataItem[];
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
      currency = DEFAULT_CURRENCY
    } = this.props;
    
    const commonClasses = "rounded-xl border border-border/50 bg-card hover:shadow-md transition-all";
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
        {/* Payment Methods Chart */}
        {createPaymentMethodCard(
          summaryData.paymentMethodChartData,
          currency,
          commonClasses
        )}
        
        {/* Expense Categories Chart */}
        {createCategoryCard(
          summaryData.categoryChartData,
          currency,
          commonClasses
        )}
        
        {/* Spending Trends */}
        {createSpendingTrendsCard(
          transactions,
          'month',
          true,
          true,
          currency,
          commonClasses
        )}
        
        {/* Card Optimization */}
        {createCardOptimizationCard(
          transactions,
          paymentMethods,
          currency,
          commonClasses
        )}
        
        {/* Savings Potential */}
        {createSavingsPotentialCard(
          transactions,
          20,
          currency,
          commonClasses
        )}
        
        {/* Category Analysis - Using direct component with common props */}
        <div className={commonClasses}>
          <CategoryAnalysisCard
            title="Category Analysis"
            data={categoryChartData}
            currency={currency}
          />
        </div>
      </div>
    );
  }
}

// Simplified component for Category Analysis to maintain consistency
const CategoryAnalysisCard = ({ title, data, currency }: { 
  title: string, 
  data: PieChartDataItem[], 
  currency: Currency 
}) => {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <TagIcon className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-medium">{title}</h3>
      </div>
      
      {/* Use existing PieChartCard implementation but without redundant wrappers */}
      <div className="h-64">
        {/* The actual chart would be rendered here */}
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No category data available</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-full">
            <div className="w-full md:w-1/2 flex items-center justify-center">
              {/* Chart visualization would be here */}
            </div>
            <div className="w-full md:w-1/2 md:pl-4 mt-4 md:mt-0">
              {/* Labels would be here */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialInsightsGrid;
