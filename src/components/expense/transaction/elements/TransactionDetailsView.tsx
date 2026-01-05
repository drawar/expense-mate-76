import { Transaction } from "@/types";
import { CurrencyService } from "@/core/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUDGET_CATEGORIES } from "@/utils/constants/categories";
import { getEffectiveCategory, getMccCategory } from "@/utils/categoryMapping";

import { Button } from "@/components/ui/button";
import {
  CreditCardIcon,
  CoinsIcon,
  TagIcon,
  RotateCcwIcon,
} from "lucide-react";

interface TransactionDetailsViewProps {
  transaction: Transaction;
  onCategoryChange?: (category: string) => void;
}

const TransactionDetailsView = ({
  transaction,
  onCategoryChange,
}: TransactionDetailsViewProps) => {
  const mccCategory = getMccCategory(transaction);
  const effectiveCategory = getEffectiveCategory(transaction);
  // Use effective category, fall back to MCC category if empty
  const currentCategory = effectiveCategory || mccCategory || "Uncategorized";

  // Debug: log category values
  console.log("Category debug:", {
    effectiveCategory,
    mccCategory,
    currentCategory,
    userCategory: transaction.userCategory,
    category: transaction.category,
  });
  const isRecategorized =
    transaction.isRecategorized || currentCategory !== mccCategory;

  // Ensure current category is in the list for display
  const allCategories = [...BUDGET_CATEGORIES];
  const categoryOptions =
    currentCategory && !allCategories.includes(currentCategory)
      ? [currentCategory, ...allCategories]
      : allCategories;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Amount
          </h3>
          <p className="text-2xl font-medium">
            {CurrencyService.format(transaction.amount, transaction.currency)}
          </p>
          {transaction.currency !== transaction.paymentCurrency && (
            <p className="text-sm text-muted-foreground">
              Paid as{" "}
              {CurrencyService.format(
                transaction.paymentAmount,
                transaction.paymentCurrency
              )}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Category
          </h3>
          <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            {onCategoryChange ? (
              <Select value={currentCategory} onValueChange={onCategoryChange}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium">{currentCategory}</p>
            )}
          </div>
          {isRecategorized && mccCategory !== "Uncategorized" && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                Merchant type: {mccCategory}
              </p>
              {onCategoryChange && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onCategoryChange(mccCategory)}
                >
                  <RotateCcwIcon className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
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
                {transaction.rewardPoints.toLocaleString()}{" "}
                {transaction.paymentMethod.pointsCurrency || "points"}
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
      </div>
    </div>
  );
};

export default TransactionDetailsView;
