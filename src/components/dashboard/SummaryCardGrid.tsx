
import React from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import SpendingByCategoryCard from './PieChartCard';
import SummaryCard from './SummaryCard';
import PointsSummaryCard from './PointsSummaryCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';

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
        <div className="space-y-6">
          <SummaryCard 
            totalAmount={totalExpenses}
            transactionCount={transactionCount}
            averageAmount={averageAmount}
            topPaymentMethod={topPaymentMethod}
            displayCurrency={displayCurrency}
          />
          
          <div className="flex justify-end">
            <Link to="/reward-points">
              <Button variant="outline" size="sm" className="flex gap-2 items-center">
                <span>View Reward Points Analytics</span>
                <ExternalLinkIcon size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="col-span-1">
        <SpendingByCategoryCard 
          title="Spending by Category" 
          data={[]} // You'll need to pass actual category spending data
        />
      </div>
    </div>
  );
};

export default SummaryCardGrid;
