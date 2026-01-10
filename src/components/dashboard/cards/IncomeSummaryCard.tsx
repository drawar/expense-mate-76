import React from "react";
import { Link } from "react-router-dom";
import { TrendingUpIcon, TrendingDownIcon, ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { Currency } from "@/types";

interface IncomeSummaryCardProps {
  totalIncome: number;
  netExpenses: number;
  displayCurrency: Currency;
  className?: string;
}

/**
 * Dashboard card showing income and net flow (income - expenses)
 */
export const IncomeSummaryCard: React.FC<IncomeSummaryCardProps> = ({
  totalIncome,
  netExpenses,
  displayCurrency,
  className,
}) => {
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  const netFlow = totalIncome - netExpenses;
  const isPositive = netFlow >= 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5 text-[var(--color-success)]" />
          Income & Savings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Income */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Total Income</p>
          <p className="text-3xl font-medium tracking-tight text-[var(--color-success)]">
            {formatCurrency(totalIncome)}
          </p>
        </div>

        {/* Net Flow */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-muted-foreground mb-1">Net Cash Flow</p>
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUpIcon className="h-5 w-5 text-[var(--color-success)]" />
            ) : (
              <TrendingDownIcon className="h-5 w-5 text-destructive" />
            )}
            <p
              className={`text-3xl font-medium tracking-tight ${
                isPositive ? "text-[var(--color-success)]" : "text-destructive"
              }`}
            >
              {isPositive ? "+" : ""}
              {formatCurrency(netFlow)}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Income minus expenses
          </p>
        </div>

        {/* Link to Income page */}
        <Link
          to="/income"
          className="flex items-center gap-1 text-sm text-primary hover:underline mt-2"
        >
          Manage income sources
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
};
