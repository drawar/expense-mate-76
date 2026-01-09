import React from "react";
import { Transaction } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyService } from "@/core/currency";
import { formatDate } from "@/utils/dates/formatters";
import { getEffectiveCategory } from "@/utils/categoryMapping";

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
  // Determine category for display using getEffectiveCategory
  const displayCategory = React.useMemo(
    () => getEffectiveCategory(transaction),
    [transaction]
  );

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
            <p className="text-base font-medium text-foreground whitespace-nowrap">
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
            {transaction.rewardPoints !== 0 && (
              <span
                className={`font-medium ${transaction.rewardPoints < 0 ? "text-destructive" : "text-primary"}`}
              >
                {transaction.rewardPoints > 0 ? "+" : ""}
                {transaction.rewardPoints.toLocaleString()} pts
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
