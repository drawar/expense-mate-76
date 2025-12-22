// components/dashboard/cards/CardOptimizationCard.tsx
import React from "react";
import { CreditCardIcon, ArrowRightIcon } from "lucide-react";
import { Currency, Transaction, PaymentMethod } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyService } from "@/core/currency";
import { usePaymentMethodOptimization } from "@/hooks/dashboard/useChartData";
import { useDashboardContext } from "@/contexts/DashboardContext";

interface CardOptimizationCardProps {
  title: string;
  transactions?: Transaction[];
  paymentMethods?: PaymentMethod[];
  currency?: Currency;
  className?: string;
}

/**
 * Card component that analyzes transactions and suggests optimal payment methods
 * Uses context for data where applicable
 */
const CardOptimizationCard: React.FC<CardOptimizationCardProps> = ({
  title,
  transactions: propTransactions,
  paymentMethods: propPaymentMethods,
  currency: propCurrency,
  className = "",
}) => {
  // Use dashboard context for data when not provided via props
  const {
    dashboardData,
    paymentMethods: contextPaymentMethods,
    displayCurrency,
  } = useDashboardContext();

  // Prioritize props over context data
  const transactions =
    propTransactions || dashboardData?.filteredTransactions || [];
  const paymentMethods = propPaymentMethods || contextPaymentMethods || [];
  const currency = propCurrency || displayCurrency;

  // Use the payment method optimization hook
  const suggestions = usePaymentMethodOptimization(
    transactions,
    paymentMethods
  );

  // Calculate total potential annual savings
  const totalPotentialSavings =
    suggestions.reduce(
      (sum, suggestion) => sum + suggestion.potentialSavings,
      0
    ) * 12; // Multiply by 12 for annual estimate

  // Hide card entirely when no suggestions
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Potential annual savings:
            </p>
            <p className="font-medium text-[var(--color-success)]">
              +{CurrencyService.format(totalPotentialSavings, currency)}
            </p>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">
                    {suggestion.category}
                  </span>
                  <span className="text-[var(--color-success)] text-xs">
                    +
                    {CurrencyService.format(
                      suggestion.potentialSavings,
                      currency
                    )}
                    /mo
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {suggestion.transactionCount} transactions
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-xs font-medium truncate">
                      {suggestion.currentMethod}
                    </p>
                  </div>
                  <div className="mx-2">
                    <ArrowRightIcon size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Suggested</p>
                    <p className="text-xs font-medium text-primary truncate">
                      {suggestion.suggestedMethod}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(CardOptimizationCard);
