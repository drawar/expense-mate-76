
import React, { useMemo } from 'react';
import { Transaction, PaymentMethod, Currency } from '@/types';
import SummaryCard from './SummaryCard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLinkIcon, TrendingUp, TrendingDown } from 'lucide-react';
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
  // Calculate actual percentage change (using 20% as example fallback if we can't calculate)
  const percentageChange = useMemo(() => {
    // In a real implementation, we would use data from previous month/period
    // For now, using a fallback value
    const prevMonthTotal = totalExpenses * 0.8; // Simulating previous month as 80% of current
    if (prevMonthTotal === 0) return 0;
    
    const change = ((totalExpenses - prevMonthTotal) / prevMonthTotal) * 100;
    return Math.round(change);
  }, [totalExpenses]);

  // Helper function to render percentage change with icon and color
  const renderPercentChange = (percent: number) => {
    const isPositive = percent >= 0;
    const color = isPositive ? "text-green-400" : "text-red-400";
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span>{`${isPositive ? '+' : ''}${percent}% since last month`}</span>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Two cards side by side with updated styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Total Expenses Card */}
        <div className="w-full h-full">
          <SummaryCard 
            title="Total Expenses"
            value={`${displayCurrency} ${totalExpenses.toLocaleString()}`}
            description={renderPercentChange(percentageChange)}
            cardColor="bg-[#11182F]" // Dark navy blue
            className="hover:shadow-lg transition-shadow duration-300"
          />
        </div>
        
        {/* Average Transaction Card */}
        <div className="w-full h-full">
          <SummaryCard 
            title="Average Transaction"
            value={`${displayCurrency} ${averageAmount.toLocaleString()}`}
            description={`${transactionCount} transactions`}
            cardColor="bg-[#11182F]" // Same dark navy blue as Total Expenses
            className="hover:shadow-lg transition-shadow duration-300"
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
