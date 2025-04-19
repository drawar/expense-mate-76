import { Transaction } from "@/types";
import { currencyService } from "@/services/CurrencyService";

import { CreditCardIcon, CoinsIcon } from "lucide-react";

interface TransactionDetailsViewProps {
  transaction: Transaction;
}

const TransactionDetailsView = ({
  transaction,
}: TransactionDetailsViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Amount
          </h3>
          <p className="text-2xl font-semibold">
            {currencyService.format(transaction.amount, transaction.currency)}
          </p>
          {transaction.currency !== transaction.paymentCurrency && (
            <p className="text-sm text-muted-foreground">
              Paid as{" "}
              {currencyService.format(
                transaction.paymentAmount,
                transaction.paymentCurrency
              )}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Payment Method
          </h3>
          <div className="flex items-center gap-2">
            <CreditCardIcon className="h-4 w-4" />
            <div>
              <p className="font-medium">{transaction.paymentMethod.name}</p>
              <p className="text-sm text-muted-foreground">
                {transaction.paymentMethod.issuer}
              </p>
            </div>
          </div>
        </div>

        {transaction.rewardPoints > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Reward Points
            </h3>
            <div className="flex items-center gap-2">
              <CoinsIcon className="h-4 w-4 text-amber-500" />
              <p className="font-medium">
                {transaction.rewardPoints.toLocaleString()} points
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {transaction.merchant.address && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Merchant Address
            </h3>
            <p>{transaction.merchant.address}</p>
          </div>
        )}

        {transaction.notes && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">
              Notes
            </h3>
            <p>{transaction.notes}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Transaction ID
          </h3>
          <p className="text-xs font-mono">{transaction.id}</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsView;
