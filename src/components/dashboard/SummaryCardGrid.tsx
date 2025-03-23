
import { Transaction, PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';
import { CreditCardIcon, TrendingUpIcon, CoinsIcon } from 'lucide-react';
import SummaryCard from './SummaryCard';

interface SummaryCardGridProps {
  filteredTransactions: Transaction[];
  totalExpenses: number;
  transactionCount: number;
  averageAmount: number;
  topPaymentMethod: { name: string; value: number } | undefined;
  totalRewardPoints: number;
}

const SummaryCardGrid = ({
  filteredTransactions,
  totalExpenses,
  transactionCount,
  averageAmount,
  topPaymentMethod,
  totalRewardPoints,
}: SummaryCardGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Expenses"
        value={formatCurrency(totalExpenses, 'USD')}
        description={`${transactionCount} transactions`}
      />
            
      <SummaryCard
        title="Average Transaction"
        value={formatCurrency(averageAmount, 'USD')}
        description="Per transaction"
        icon={<TrendingUpIcon className="w-3.5 h-3.5 mr-1" />}
      />
            
      <SummaryCard
        title="Most Used Payment"
        value={topPaymentMethod?.name || 'None'}
        description={topPaymentMethod 
          ? formatCurrency(topPaymentMethod.value, 'USD')
          : 'No data'}
        icon={<CreditCardIcon className="w-3.5 h-3.5 mr-1" />}
      />
            
      <SummaryCard
        title="Total Reward Points"
        value={typeof totalRewardPoints === 'number' 
          ? totalRewardPoints.toLocaleString() 
          : '0'}
        description="Points earned"
        icon={<CoinsIcon className="w-3.5 h-3.5 mr-1" />}
      />
    </div>
  );
};

export default SummaryCardGrid;
