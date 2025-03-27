
import React from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import SpendingByCategoryCard from './PieChartCard';
import SummaryCard from './SummaryCard';
import PointsSummaryCard from './PointsSummaryCard';

interface SummaryCardGridProps {
  filteredTransactions: Transaction[];
  totalExpenses: number;
  transactionCount: number;
  averageAmount: number;
  topPaymentMethod: { name: string; value: number };
  totalRewardPoints: number;
  displayCurrency: Currency;
}

const SummaryCardGrid: React.FC<SummaryCardGridProps> = ({
  filteredTransactions,
  totalExpenses,
  transactionCount,
  averageAmount,
  topPaymentMethod,
  totalRewardPoints,
  displayCurrency
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="col-span-1">
        <SummaryCard 
          totalExpenses={totalExpenses}
          transactionCount={transactionCount}
          averageAmount={averageAmount}
          topPaymentMethod={topPaymentMethod}
          displayCurrency={displayCurrency}
        />
      </div>
      <div className="col-span-1">
        <SpendingByCategoryCard 
          title="Spending by Category" 
          data={[]} // You'll need to pass actual category spending data
        />
      </div>
      <div className="col-span-1 lg:col-span-2">
        <PointsSummaryCard 
          totalRewardPoints={totalRewardPoints}
        />
      </div>
    </div>
  );
};

export default SummaryCardGrid;
