
import React from 'react';
import { Transaction } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyService } from '@/core/currency';
import { formatDate } from '@/utils/dates/formatters';
import { getCategoryFromMCC, getCategoryFromMerchantName } from '@/utils/categoryMapping';

interface TransactionCardProps {
  transaction: Transaction;
  className?: string;
  onClick?: () => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ 
  transaction, 
  className = '',
  onClick 
}) => {
  // Determine category for display
  const displayCategory = React.useMemo(() => {
    // Use transaction's stored category if available
    if (transaction.category && transaction.category !== "Uncategorized") {
      return transaction.category;
    }

    // Try to determine from MCC
    if (transaction.merchant.mcc?.code) {
      return getCategoryFromMCC(transaction.merchant.mcc.code);
    }

    // Try to determine from merchant name
    const nameBasedCategory = getCategoryFromMerchantName(transaction.merchant.name);
    if (nameBasedCategory) {
      return nameBasedCategory;
    }

    return "Uncategorized";
  }, [transaction]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${className}`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with merchant name and date */}
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate">
                {transaction.merchant.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </p>
            </div>
            <Badge variant="secondary" className="ml-2 text-xs">
              {displayCategory}
            </Badge>
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {CurrencyService.format(transaction.amount, transaction.currency)}
              </p>
              {transaction.currency !== transaction.paymentCurrency && (
                <p className="text-xs text-muted-foreground">
                  Paid: {CurrencyService.format(transaction.paymentAmount, transaction.paymentCurrency)}
                </p>
              )}
            </div>
          </div>

          {/* Payment method and points */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate">
              {transaction.paymentMethod.name}
            </span>
            {transaction.rewardPoints > 0 && (
              <span className="text-primary font-medium">
                {transaction.rewardPoints.toLocaleString()} pts
              </span>
            )}
          </div>

          {/* Transaction type indicators */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {transaction.merchant.isOnline ? (
              <span>Online</span>
            ) : (
              <span>In-store</span>
            )}
            {transaction.isContactless && !transaction.merchant.isOnline && (
              <>
                <span>•</span>
                <span>Contactless</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(TransactionCard);
