
import React from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import SummaryCard from './SummaryCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

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
    <div className="w-full">
      {/* Total Expenses and Average Transaction Cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Total Expenses Card */}
        <div className="w-full h-full">
          <SummaryCard 
            title="Total Expenses"
            value={`${displayCurrency} ${totalExpenses.toLocaleString()}`}
            description={`From ${transactionCount} transactions`}
          />
        </div>
        
        {/* Average Transaction Card */}
        <div className="w-full h-full">
          <SummaryCard 
            title="Average Transaction"
            value={`${displayCurrency} ${averageAmount.toLocaleString()}`}
            description={`${transactionCount} transactions`}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Link to="/reward-points">
          <Button variant="outline" size="sm" className="flex gap-2 items-center">
            <span>View Reward Points Analytics</span>
            <ExternalLinkIcon size={16} />
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default SummaryCardGrid;
