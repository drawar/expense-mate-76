
import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/currencyFormatter';
import { formatDate } from '@/utils/dateUtils';
import { CreditCardIcon, BanknoteIcon, TagIcon, MapPinIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
  className?: string;
}

const TransactionCard = ({ transaction, onClick, className }: TransactionCardProps) => {
  const { 
    merchant, 
    amount, 
    currency, 
    date, 
    paymentMethod, 
    rewardPoints 
  } = transaction;

  const isPaymentDifferent = transaction.paymentAmount !== amount || 
                              transaction.paymentCurrency !== currency;

  return (
    <div 
      className={cn(
        "glass-card p-4 rounded-xl transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg cursor-pointer",
        onClick && "hover:ring-1 hover:ring-primary/20",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-medium text-lg line-clamp-1 break-words">{merchant.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(date)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-lg whitespace-nowrap">{formatCurrency(amount, currency)}</p>
          {isPaymentDifferent && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
              Paid: {formatCurrency(transaction.paymentAmount, transaction.paymentCurrency)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
        <div className="flex items-center text-sm rounded-full px-3 py-1 bg-gray-100 dark:bg-gray-800 max-w-full">
          {paymentMethod.type === 'credit_card' ? (
            <CreditCardIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" style={{ color: paymentMethod.color }} />
          ) : (
            <BanknoteIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" style={{ color: paymentMethod.color }} />
          )}
          <span className="truncate max-w-[120px]">{paymentMethod.name}</span>
        </div>

        {merchant.mcc && (
          <div className="flex items-center text-sm rounded-full px-3 py-1 bg-gray-100 dark:bg-gray-800 max-w-full">
            <TagIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-purple-500" />
            <span className="truncate">{merchant.mcc.description}</span>
          </div>
        )}

        {rewardPoints > 0 && (
          <div className="flex items-center text-sm rounded-full px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 whitespace-nowrap">
            <span>+{rewardPoints} points</span>
          </div>
        )}

        {merchant.address && (
          <div className="flex items-center text-sm rounded-full px-3 py-1 bg-gray-100 dark:bg-gray-800 w-full mt-1 max-w-full">
            <MapPinIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-red-500" />
            <span className="truncate">{merchant.address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionCard;
