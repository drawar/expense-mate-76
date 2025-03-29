import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';
import { createExpenseSummaryCard } from '@/components/dashboard/cards/ExpenseSummaryCard';
import { createTransactionSummaryCard } from '@/components/dashboard/cards/TransactionSummaryCard';
import { createPaymentMethodSummaryCard } from '@/components/dashboard/cards/PaymentMethodSummaryCard';
import { createRewardPointsSummaryCard } from '@/components/dashboard/cards/RewardPointsSummaryCard';
import { SummaryData } from '@/utils/SummaryDataProcessor';
import { Transaction, Currency } from '@/types';

interface SummaryCardGridProps {
  filteredTransactions: Transaction[];
  summaryData: SummaryData;
  displayCurrency: Currency;
}

const SummaryCardGrid: React.FC<SummaryCardGridProps> = ({
  filteredTransactions,
  summaryData,
  displayCurrency
}) => {
  const {
    totalExpenses,
    transactionCount,
    averageAmount,
    topPaymentMethod,
    totalRewardPoints,
    percentageChange
  } = summaryData;

  return (
    <div className="w-full">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Now we directly use the calculated metrics from summaryData */}
        {createExpenseSummaryCard(totalExpenses, percentageChange, displayCurrency)}
        
        {createTransactionSummaryCard(transactionCount, averageAmount, displayCurrency)}
        
        {createPaymentMethodSummaryCard(
          topPaymentMethod?.name || "N/A", 
          topPaymentMethod?.value || 0, 
          displayCurrency
        )}
        
        {createRewardPointsSummaryCard(totalRewardPoints, filteredTransactions)}
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
