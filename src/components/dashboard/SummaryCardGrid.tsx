
import { Transaction, PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';
import { CreditCardIcon, TrendingUpIcon, CoinsIcon, CalendarIcon } from 'lucide-react';
import SummaryCard from './SummaryCard';
import PaymentCardDisplay from '../expense/PaymentCardDisplay';

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
  // Find the payment method object that matches the top payment method
  const findPaymentMethodByName = (name: string): PaymentMethod | undefined => {
    if (!filteredTransactions.length) return undefined;
    
    return filteredTransactions.find(tx => 
      tx.paymentMethod.name === name
    )?.paymentMethod;
  };

  const topPaymentMethodObject = topPaymentMethod 
    ? findPaymentMethodByName(topPaymentMethod.name) 
    : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="Total Expenses"
        value={formatCurrency(totalExpenses, 'USD')}
        description={`${transactionCount} transactions`}
        icon={<CalendarIcon className="w-3.5 h-3.5 text-primary" />}
      />
            
      <SummaryCard
        title="Average Transaction"
        value={formatCurrency(averageAmount, 'USD')}
        description="Per transaction"
        icon={<TrendingUpIcon className="w-3.5 h-3.5 text-green-500 mr-1" />}
      />
            
      <SummaryCard
        title="Most Used Payment"
        value={topPaymentMethod?.name || 'None'}
        description={topPaymentMethod 
          ? formatCurrency(topPaymentMethod.value, 'USD')
          : 'No data'}
        icon={<CreditCardIcon className="w-3.5 h-3.5 text-blue-500 mr-1" />}
        customContent={topPaymentMethodObject && topPaymentMethodObject.type === 'credit_card' ? (
          <div className="mt-2 scale-[0.65] origin-top-left">
            <PaymentCardDisplay 
              paymentMethod={topPaymentMethodObject} 
              customImage={topPaymentMethodObject.imageUrl}
            />
          </div>
        ) : undefined}
      />
            
      <SummaryCard
        title="Total Reward Points"
        value={totalRewardPoints.toLocaleString()}
        description="Points earned"
        icon={<CoinsIcon className="w-3.5 h-3.5 text-amber-500 mr-1" />}
      />
    </div>
  );
};

export default SummaryCardGrid;
