
import { Transaction, PaymentMethod, Currency } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';
import { CreditCardIcon, TrendingUpIcon, CoinsIcon, CalendarIcon } from 'lucide-react';
import SummaryCard from './SummaryCard';
import PaymentCardDisplay from '../expense/PaymentCardDisplay';
import { CardTitle } from '@/components/ui/card';

interface SummaryCardGridProps {
  filteredTransactions: Transaction[];
  totalExpenses: number;
  transactionCount: number;
  averageAmount: number;
  topPaymentMethod: { name: string; value: number } | undefined;
  totalRewardPoints: number;
  displayCurrency: Currency;
}

const SummaryCardGrid = ({
  filteredTransactions,
  totalExpenses,
  transactionCount,
  averageAmount,
  topPaymentMethod,
  totalRewardPoints,
  displayCurrency,
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
        value={formatCurrency(totalExpenses, displayCurrency)}
        description={`${transactionCount} transactions in ${displayCurrency}`}
        icon={<CalendarIcon className="w-3.5 h-3.5" />}
      />
            
      <SummaryCard
        title="Average Transaction"
        value={formatCurrency(averageAmount, displayCurrency)}
        description={`Per transaction in ${displayCurrency}`}
        icon={<TrendingUpIcon className="w-3.5 h-3.5 text-green-500" />}
      />
            
      <SummaryCard
        title="Most Used Payment"
        value={topPaymentMethod?.name || 'None'}
        description={topPaymentMethod 
          ? formatCurrency(topPaymentMethod.value, displayCurrency)
          : 'No data'}
        icon={<CreditCardIcon className="w-3.5 h-3.5 text-blue-500" />}
        customContent={topPaymentMethodObject && topPaymentMethodObject.type === 'credit_card' ? (
          <div className="mt-2 h-12 flex items-center mb-2">
            <div className="scale-[0.50] origin-left -ml-6">
              <PaymentCardDisplay 
                paymentMethod={topPaymentMethodObject} 
                customImage={topPaymentMethodObject.imageUrl}
              />
            </div>
          </div>
        ) : (
          <CardTitle className="text-2xl font-bold mt-1 truncate">
            {topPaymentMethod?.name || 'None'}
          </CardTitle>
        )}
      />
            
      <SummaryCard
        title="Total Reward Points"
        value={totalRewardPoints.toLocaleString()}
        description="Points earned"
        icon={<CoinsIcon className="w-3.5 h-3.5 text-amber-500" />}
      />
    </div>
  );
};

export default SummaryCardGrid;
