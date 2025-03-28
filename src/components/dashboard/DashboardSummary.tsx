// src/components/dashboard/DashboardSummary.tsx
import React, { Component } from 'react';
import { Transaction } from '@/types';
import { SummaryData } from '@/utils/SummaryDataProcessor';
import SummaryCardGrid from '@/components/dashboard/SummaryCardGrid';

interface DashboardSummaryProps {
  transactions: Transaction[];
  summaryData: SummaryData;
}

/**
 * Component that displays summary statistics for the dashboard
 * Implements a facade pattern by providing a simplified interface to the SummaryCardGrid
 */
class DashboardSummary extends Component<DashboardSummaryProps> {
  render() {
    const { transactions, summaryData } = this.props;
    
    return (
      <div className="mb-4">
        <div className="space-y-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#a855f7]">
              Expense Summary
            </h2>
          </div>
          
          <SummaryCardGrid
            filteredTransactions={transactions}
            totalExpenses={summaryData.totalExpenses}
            transactionCount={summaryData.transactionCount}
            averageAmount={summaryData.averageAmount}
            topPaymentMethod={summaryData.topPaymentMethod}
            totalRewardPoints={summaryData.totalRewardPoints}
            displayCurrency="SGD"
          />
        </div>
      </div>
    );
  }
}

export default DashboardSummary;
