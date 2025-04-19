import { Transaction } from "@/types";
import { currencyService } from "@/services/CurrencyService";
import { formatDate } from "@/utils/dateUtils";
import {
  CreditCardIcon,
  BanknoteIcon,
  TagIcon,
  MapPinIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CSSProperties } from "react";

interface TransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

const TransactionCard = ({
  transaction,
  onClick,
  className,
  style,
}: TransactionCardProps) => {
  const { merchant, amount, currency, date, paymentMethod, rewardPoints } =
    transaction;

  const isPaymentDifferent =
    transaction.paymentAmount !== amount ||
    transaction.paymentCurrency !== currency;

  return (
    <div
      className={cn(
        "modern-card p-4 overflow-hidden",
        onClick &&
          "cursor-pointer hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200",
        className
      )}
      onClick={onClick}
      style={style}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <h3
            className="font-semibold text-base md:text-lg truncate"
            title={merchant.name}
          >
            {merchant.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(date)}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p
            className="font-semibold text-base md:text-lg whitespace-nowrap"
            title={currencyService.format(amount, currency)}
          >
            {currencyService.format(amount, currency)}
          </p>
          {isPaymentDifferent && (
            <p
              className="text-sm text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap"
              title={`Paid: ${currencyService.format(transaction.paymentAmount, transaction.paymentCurrency)}`}
            >
              Paid:{" "}
              {currencyService.format(
                transaction.paymentAmount,
                transaction.paymentCurrency
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
        <div className="inline-flex items-center text-xs rounded-full px-3 py-1 bg-blue-50 dark:bg-blue-900/30 max-w-full">
          {paymentMethod.type === "credit_card" ? (
            <CreditCardIcon
              className="h-3.5 w-3.5 mr-1.5 flex-shrink-0"
              style={{ color: paymentMethod.color }}
            />
          ) : (
            <BanknoteIcon
              className="h-3.5 w-3.5 mr-1.5 flex-shrink-0"
              style={{ color: paymentMethod.color }}
            />
          )}
          <span className="truncate" title={paymentMethod.name}>
            {paymentMethod.name}
          </span>
        </div>

        {merchant.mcc && (
          <div className="inline-flex items-center text-xs rounded-full px-3 py-1 bg-purple-50 dark:bg-purple-900/30 max-w-full">
            <TagIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-purple-500" />
            <span className="truncate" title={merchant.mcc.description}>
              {merchant.mcc.description}
            </span>
          </div>
        )}

        {rewardPoints > 0 && (
          <div className="inline-flex items-center text-xs rounded-full px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 whitespace-nowrap">
            <span>+{rewardPoints} points</span>
          </div>
        )}

        {merchant.address && (
          <div className="inline-flex items-center text-xs rounded-full px-3 py-1 bg-red-50 dark:bg-red-900/30 max-w-full">
            <MapPinIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-red-500" />
            <span className="truncate" title={merchant.address}>
              {merchant.address}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionCard;
