// components/dashboard/cards/FrequentMerchantsCard.tsx
import React from "react";
import { StoreIcon, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CurrencyService } from "@/core/currency";

interface FrequentMerchantsCardProps {
  transactions: Transaction[];
  currency?: Currency;
  className?: string;
  maxDisplayed?: number;
}

interface MerchantStats {
  name: string;
  count: number;
  totalSpent: number;
  mccCode?: string;
}

/**
 * Card component that displays frequent merchants with quick-add buttons
 */
const FrequentMerchantsCard: React.FC<FrequentMerchantsCardProps> = ({
  transactions,
  currency = "SGD",
  className = "",
  maxDisplayed = 3,
}) => {
  // Aggregate transactions by merchant
  const merchantStats = React.useMemo(() => {
    const statsMap = new Map<string, MerchantStats>();

    transactions.forEach((tx) => {
      const merchantName = tx.merchant?.name?.trim();
      if (!merchantName) return;

      const key = merchantName.toLowerCase();
      const existing = statsMap.get(key);

      // Get amount in display currency
      const amount =
        tx.currency === currency
          ? tx.amount
          : (tx.convertedAmount ?? tx.amount);

      if (existing) {
        existing.count += 1;
        existing.totalSpent += amount;
        // Keep the most recent MCC code
        if (tx.merchant?.mcc?.code) {
          existing.mccCode = tx.merchant.mcc.code;
        }
      } else {
        statsMap.set(key, {
          name: merchantName,
          count: 1,
          totalSpent: amount,
          mccCode: tx.merchant?.mcc?.code,
        });
      }
    });

    // Sort by count (descending) and take top N
    return Array.from(statsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, maxDisplayed);
  }, [transactions, currency, maxDisplayed]);

  // Build URL for quick add
  const buildAddExpenseUrl = (merchant: MerchantStats): string => {
    const params = new URLSearchParams();
    params.set("merchantName", merchant.name);
    if (merchant.mccCode) {
      params.set("mccCode", merchant.mccCode);
    }
    return `/add-expense?${params.toString()}`;
  };

  // Hide when no merchants
  if (merchantStats.length === 0) {
    return null;
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <StoreIcon className="h-5 w-5 text-primary" />
            Frequent Merchants
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {merchantStats.map((merchant) => (
            <div
              key={merchant.name}
              className="flex items-center justify-between py-2"
            >
              {/* Merchant Info */}
              <div className="flex-1 min-w-0 mr-3">
                <p className="font-medium truncate">{merchant.name}</p>
                <p className="text-sm text-muted-foreground">
                  {merchant.count}{" "}
                  {merchant.count === 1 ? "transaction" : "transactions"}
                </p>
              </div>

              {/* Total Spent */}
              <div className="text-right mr-3">
                <p className="font-medium">
                  {CurrencyService.format(merchant.totalSpent, currency)}
                </p>
              </div>

              {/* Quick Add Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to={buildAddExpenseUrl(merchant)}
                      className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                      aria-label={`Add expense for ${merchant.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Add another {merchant.name} transaction</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(FrequentMerchantsCard);
