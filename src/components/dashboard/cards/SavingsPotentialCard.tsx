// src/components/dashboard/cards/SavingsPotentialCard.tsx
import React from "react";
import { PiggyBankIcon, TrendingDownIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyService } from "@/core/currency";
import { useSavingsPotential } from "@/hooks/dashboard/useChartData";

interface SavingsPotentialCardProps {
  title: string;
  transactions: Transaction[];
  savingsGoalPercentage?: number;
  currency?: Currency;
  className?: string;
}

/**
 * Card component that analyzes transactions to identify savings potential
 * Optimized with memoization and early returns
 */
const SavingsPotentialCard: React.FC<SavingsPotentialCardProps> = ({
  title,
  transactions,
  savingsGoalPercentage = 20,
  currency = "SGD",
  className = "",
}) => {
  // Check if we have transactions to analyze
  const hasTransactions = transactions.length > 0;

  // Use the savings potential hook with memoized inputs
  const analysis = useSavingsPotential(
    hasTransactions ? transactions : [],
    savingsGoalPercentage
  );

  // Memoize derived values to prevent recalculations in render
  const formattedValues = React.useMemo(() => {
    if (!hasTransactions) return null;

    const savingsPotentialFormatted = CurrencyService.format(
      analysis.savingsPotential,
      currency
    );
    const discretionarySpendingFormatted = CurrencyService.format(
      analysis.discretionarySpending,
      currency
    );
    const discretionaryPercentage = Math.round(
      (analysis.discretionarySpending / analysis.totalSpending) * 100
    );

    return {
      savingsPotentialFormatted,
      discretionarySpendingFormatted,
      discretionaryPercentage,
    };
  }, [analysis, currency, hasTransactions]);

  // Memoize the top 2 categories only to reduce clutter
  const savingsCategories = React.useMemo(() => {
    if (!hasTransactions) return [];

    return analysis.topDiscretionaryCategories
      .slice(0, 2)
      .map((category, index) => (
        <div key={index} className="flex items-center justify-between py-1">
          <div className="flex items-center">
            <TrendingDownIcon className="h-3 w-3 text-green-500 mr-1.5" />
            <span className="text-xs">{category.category}</span>
          </div>
          <span className="text-xs text-green-500">
            -{CurrencyService.format(category.savingsPotential, currency)}
          </span>
        </div>
      ));
  }, [analysis.topDiscretionaryCategories, currency, hasTransactions]);

  // Early return for empty state
  if (!hasTransactions) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <PiggyBankIcon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <PiggyBankIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              No transaction data available.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add transactions to see savings potential.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <PiggyBankIcon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Combined Spending Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-xs text-muted-foreground mb-0.5">Can Save</p>
              <p className="font-semibold text-green-600 dark:text-green-400">
                {formattedValues?.savingsPotentialFormatted}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-0.5">
                Discretionary
              </p>
              <p className="font-semibold">
                {formattedValues?.discretionarySpendingFormatted}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {formattedValues?.discretionaryPercentage}% of total
              </p>
            </div>
          </div>

          {/* Top Savings Categories - show only if there are categories */}
          {savingsCategories.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs font-medium mb-1.5 text-muted-foreground">
                Top opportunities
              </p>
              {savingsCategories}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(SavingsPotentialCard);
