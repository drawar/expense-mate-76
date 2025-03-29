import React, { useMemo } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon } from 'lucide-react';
import { createExpenseSummaryCard } from '@/components/dashboard/cards/ExpenseSummaryCard';
import { createTransactionSummaryCard } from '@/components/dashboard/cards/TransactionSummaryCard';
import { createPaymentMethodSummaryCard } from '@/components/dashboard/cards/PaymentMethodSummaryCard';
import { createRewardPointsSummaryCard } from '@/components/dashboard/cards/RewardPointsSummaryCard';

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
  // Calculate actual percentage change (using 20% as example fallback if we can't calculate)
  const percentageChange = useMemo(() => {
    // In a real implementation, we would use data from previous month/period
    // For now, using a fallback value
    const prevMonthTotal = totalExpenses * 0.8; // Simulating previous month as 80% of current
    if (prevMonthTotal === 0) return 0;
    
    const change = ((totalExpenses - prevMonthTotal) / prevMonthTotal) * 100;
    return Math.round(change);
  }, [totalExpenses]);

  return (
    <div className="w-full">
      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
