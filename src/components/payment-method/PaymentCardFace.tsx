
import React from 'react';
import { PaymentMethod } from '@/types';
import { cn } from '@/lib/utils';
import { CreditCardIcon, BanknoteIcon } from 'lucide-react';
import { PaymentIcon } from 'react-svg-credit-card-payment-icons';
import { formatCurrency } from '@/utils/currencyFormatter';
import { useTransactionFiltering } from '@/hooks/dashboard/useTransactionFiltering';
import { useTransactionsQuery } from '@/hooks/queries/useTransactionsQuery';

interface PaymentCardFaceProps {
  paymentMethod: PaymentMethod;
}

export const PaymentCardFace: React.FC<PaymentCardFaceProps> = ({ paymentMethod }) => {
  // Get transactions for this payment method to calculate balance
  const { data: allTransactions = [] } = useTransactionsQuery();
  const { filterTransactions } = useTransactionFiltering();
  
  // Filter transactions for this payment method in the current month
  const currentMonthTransactions = filterTransactions(allTransactions, {
    timeframe: 'thisMonth',
    paymentMethodIds: [paymentMethod.id]
  });

  // Calculate current balance
  const currentBalance = currentMonthTransactions.reduce((total, tx) => total + tx.paymentAmount, 0);

  // Determine card network for credit cards (simplified mapping)
  const getCardNetwork = (): 'Mastercard' | 'Visa' | 'Amex' | 'JCB' | 'Discover' | 'DinersClub' | null => {
    if (paymentMethod.type !== 'credit_card' || !paymentMethod.issuer) {
      return null;
    }
    
    const issuerLower = paymentMethod.issuer.toLowerCase();
    
    if (issuerLower.includes('mastercard') || issuerLower.includes('master')) {
      return 'Mastercard';
    } else if (issuerLower.includes('visa')) {
      return 'Visa';
    } else if (issuerLower.includes('amex') || issuerLower.includes('american express')) {
      return 'Amex';
    } else if (issuerLower.includes('jcb')) {
      return 'JCB';
    } else if (issuerLower.includes('discover')) {
      return 'Discover';
    } else if (issuerLower.includes('diners') || issuerLower.includes('diner')) {
      return 'DinersClub';
    }
    
    return 'Visa'; // Default fallback
  };

  const cardNetwork = getCardNetwork();
  
  // Generate a background gradient based on the payment method
  const getCardBackground = () => {
    if (paymentMethod.type === 'cash') {
      return 'bg-gradient-to-br from-emerald-500 to-teal-700';
    }
    
    // Credit card background based on issuer
    const issuerLower = paymentMethod.issuer?.toLowerCase() || '';
    
    if (issuerLower.includes('amex') || issuerLower.includes('american')) {
      return 'bg-gradient-to-br from-blue-500 to-indigo-800';
    } else if (issuerLower.includes('visa')) {
      return 'bg-gradient-to-br from-blue-400 to-blue-700';
    } else if (issuerLower.includes('mastercard')) {
      return 'bg-gradient-to-br from-orange-500 to-red-700';
    } else if (issuerLower.includes('discover')) {
      return 'bg-gradient-to-br from-orange-400 to-orange-700';
    } else if (issuerLower.includes('diners')) {
      return 'bg-gradient-to-br from-slate-500 to-slate-800';
    } else if (issuerLower.includes('jcb')) {
      return 'bg-gradient-to-br from-green-500 to-emerald-700';
    } else if (issuerLower.includes('uob')) {
      return 'bg-gradient-to-br from-blue-600 to-indigo-900';
    } else if (issuerLower.includes('dbs')) {
      return 'bg-gradient-to-br from-red-600 to-red-900';
    } else if (issuerLower.includes('ocbc')) {
      return 'bg-gradient-to-br from-red-500 to-orange-800';
    }
    
    // Default purple gradient
    return 'bg-gradient-to-br from-purple-500 to-purple-800';
  };

  return (
    <div className={cn(
      "rounded-xl w-full h-[200px] p-6 text-white relative overflow-hidden shadow-lg",
      getCardBackground()
    )}>
      {/* Card Network Logo */}
      {paymentMethod.type === 'credit_card' && cardNetwork && (
        <div className="absolute top-4 right-4">
          <PaymentIcon type={cardNetwork} format="logo" width={60} />
        </div>
      )}
      
      {/* Card Type Icon (for cash) */}
      {paymentMethod.type === 'cash' && (
        <div className="absolute top-4 right-4">
          <BanknoteIcon className="h-10 w-10 opacity-80" />
        </div>
      )}
      
      {/* Current Balance Label */}
      <div className="text-sm text-white/80">Current Balance</div>
      
      {/* Balance Amount */}
      <div className="text-2xl font-bold mt-1">
        {formatCurrency(currentBalance, paymentMethod.currency)}
      </div>
      
      {/* Card Details */}
      <div className="absolute bottom-6 left-6 right-6">
        {paymentMethod.type === 'credit_card' ? (
          <>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="mr-2">
                  {Array(4).fill('●').join(' ')}
                </div>
                {paymentMethod.lastFourDigits && (
                  <div className="font-mono">{paymentMethod.lastFourDigits}</div>
                )}
              </div>
              
              {/* Expiry date placeholder - replace with actual data if available */}
              <div className="font-mono text-sm">MM/YY</div>
            </div>
            
            {/* Card name */}
            <div className="text-sm font-medium truncate">
              {`${paymentMethod.issuer || ''} ${paymentMethod.name}`}
            </div>
          </>
        ) : (
          <div className="text-sm font-medium">
            {`${paymentMethod.name} (${paymentMethod.currency})`}
          </div>
        )}
      </div>
      
      {/* Background pattern/design */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-10">
        <div className="absolute -right-20 -top-20 rounded-full w-80 h-80 bg-white/20"></div>
        <div className="absolute -left-20 -bottom-20 rounded-full w-80 h-80 bg-white/10"></div>
      </div>
      
      {/* Custom image overlay if available */}
      {paymentMethod.imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={paymentMethod.imageUrl} 
            alt={paymentMethod.name}
            className="object-contain w-full h-full opacity-60 mix-blend-overlay"
          />
        </div>
      )}
      
      {/* Inactive overlay */}
      {!paymentMethod.active && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/20 px-4 py-2 rounded-full text-white font-bold rotate-[-15deg]">
            Inactive
          </div>
        </div>
      )}
    </div>
  );
};
