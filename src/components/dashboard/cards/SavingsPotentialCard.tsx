// src/components/dashboard/cards/SavingsPotentialCard.tsx
import React from "react";
import { PiggyBankIcon, TrendingDownIcon, BarChart3Icon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyService } from "@/services/CurrencyService";
import { Progress } from "@/components/ui/progress";
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
    const savingsProgressRounded = Math.round(analysis.savingsProgress);
    const discretionarySpendingFormatted = CurrencyService.format(
      analysis.discretionarySpending,
      currency
    );
    const discretionaryPercentage = Math.round(
      (analysis.discretionarySpending / analysis.totalSpending) * 100
    );

    return {
      savingsPotentialFormatted,
      savingsProgressRounded,
      discretionarySpendingFormatted,
      discretionaryPercentage,
    };
  }, [analysis, currency, hasTransactions]);

  // Memoize the categories to prevent unnecessary re-renders
  const savingsCategories = React.useMemo(() => {
    if (!hasTransactions) return [];

    return analysis.topDiscretionaryCategories.map((category, index) => (
      <div
        key={index}
        className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
      >
        <div className="flex items-center">
          <TrendingDownIcon className="h-3.5 w-3.5 text-green-500 mr-2" />
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Monthly Savings Potential
            </p>
            <p className="font-medium text-green-500">
              {formattedValues?.savingsPotentialFormatted}
            </p>
          </div>

          {/* Savings Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progress towards goal</span>
              <span>{formattedValues?.savingsProgressRounded}%</span>
            </div>
            <Progress value={analysis.savingsProgress} className="h-2" />
          </div>

          {/* Discretionary Spending Summary */}
          <div className="p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-sm flex items-center">
                <BarChart3Icon className="h-4 w-4 mr-1" />
                Discretionary Spending
              </span>
              <span className="text-sm font-medium">
                {formattedValues?.discretionarySpendingFormatted}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formattedValues?.discretionaryPercentage}% of your total spending
            </p>
          </div>

          {/* Top Savings Categories */}
          <div className="space-y-2">
            <p className="text-xs font-medium">Top savings opportunities:</p>
            {savingsCategories}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(SavingsPotentialCard);
