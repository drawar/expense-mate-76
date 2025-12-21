import React from "react";
import { Transaction } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyService } from "@/core/currency";
import { formatDate } from "@/utils/dates/formatters";
import {
  getCategoryFromMCC,
  getCategoryFromMerchantName,
} from "@/utils/categoryMapping";

interface TransactionCardProps {
  transaction: Transaction;
  className?: string;
  onClick?: () => void;
}

const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  className = "",
  onClick,
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
    const nameBasedCategory = getCategoryFromMerchantName(
      transaction.merchant.name
    );
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
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header: merchant name and amount */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-foreground truncate flex-1">
              {transaction.merchant.name}
            </h3>
            <p className="text-base font-semibold text-foreground whitespace-nowrap">
              {CurrencyService.format(transaction.amount, transaction.currency)}
            </p>
          </div>

          {/* Secondary info: date, category, points */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>{formatDate(transaction.date)}</span>
              <span>•</span>
              <span className="truncate max-w-[100px]">{displayCategory}</span>
            </div>
            {transaction.rewardPoints > 0 && (
              <span className="text-primary font-medium">
                +{transaction.rewardPoints.toLocaleString()} pts
              </span>
            )}
          </div>

          {/* Payment method */}
          <div className="text-xs text-muted-foreground truncate">
            {transaction.paymentMethod.name}
            {transaction.currency !== transaction.paymentCurrency && (
              <span className="ml-1">
                (
                {CurrencyService.format(
                  transaction.paymentAmount,
                  transaction.paymentCurrency
                )}
                )
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(TransactionCard);
