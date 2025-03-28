// src/views/DashboardView.tsx
import React, { Component } from 'react';
import { Transaction, PaymentMethod } from '@/types';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import FinancialInsightsGrid from '@/components/dashboard/FinancialInsightsGrid';
import RecentTransactionsList from '@/components/dashboard/RecentTransactionsList';
import LoadingDashboard from '@/components/dashboard/LoadingDashboard';
import { SummaryDataProcessor } from '@/utils/SummaryDataProcessor';

interface DashboardViewProps {
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  currency?: string;
}

/**
 * View component responsible for layout and rendering of the Dashboard page.
 * Implements presentation logic and delegates to child components.
 */
class DashboardView extends Component<DashboardViewProps> {
  /**
   * Process transaction data to get recent transactions
   */
  getRecentTransactions(): Transaction[] {
    const { transactions } = this.props;
    
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }
  
  /**
   * Generate category chart data from transactions
   */
  getCategoryChartData() {
    const { transactions } = this.props;
    
    if (!transactions.length) return [];
    
    // Create a map of category -> total amount
    const categoryMap = new Map<string, number>();
    
    // Group transactions by category
    transactions.forEach(tx => {
      const category = tx.category || 'Uncategorized';
      const existingAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, existingAmount + tx.amount);
    });
    
    // Generate colors for each category
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#6366F1', // indigo
      '#EF4444', // red
      '#14B8A6', // teal
      '#F97316', // orange
      '#8B5CF6'  // purple
    ];
    
    // Convert to array with colors
    return Array.from(categoryMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by amount in descending order
      .slice(0, 10) // Take top 10 categories
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length]
      }));
  }
  
  /**
   * Render the dashboard UI
   */
  render() {
    const { transactions, paymentMethods, loading, currency = 'SGD' } = this.props;
    
    if (loading) {
      return <LoadingDashboard />;
    }
    
    // Create a data processor to handle summary calculations
    const dataProcessor = new SummaryDataProcessor(transactions, currency);
    const summaryData = dataProcessor.getSummaryData('thisMonth', false, 15);
    
    // Get recent transactions and category data
    const recentTransactions = this.getRecentTransactions();
    const categoryChartData = this.getCategoryChartData();
    
    return (
      <div className="min-h-screen">  
        <div className="container max-w-7xl mx-auto pb-16">
          <DashboardHeader />
          
          <DashboardSummary 
            transactions={transactions} 
            summaryData={summaryData} 
          />
          
          <FinancialInsightsGrid 
            transactions={transactions} 
            paymentMethods={paymentMethods}
            summaryData={summaryData}
            categoryChartData={categoryChartData}
            currency={currency}
          />
          
          <RecentTransactionsList 
            recentTransactions={recentTransactions} 
          />
        </div>
      </div>
    );
  }
}

export default DashboardView;
