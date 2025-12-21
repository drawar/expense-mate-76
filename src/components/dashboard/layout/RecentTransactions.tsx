// components/dashboard/layout/RecentTransactions.tsx
import React, { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { Transaction, Currency } from "@/types";
import { Button } from "@/components/ui/button";
import { PlusCircleIcon, ArrowUpRightIcon } from "lucide-react";
import TransactionCard from "@/components/expense/TransactionCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import { CurrencyService } from "@/core/currency";

interface RecentTransactionsProps {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  displayCurrency?: Currency;
  maxItems?: number;
}

/**
 * Displays the most recent transactions in a grid layout
 * Optimized with memoization and stable callbacks to prevent unnecessary re-renders
 */
const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  allTransactions,
  displayCurrency = "CAD",
  maxItems = 5,
}) => {
  // Use the media query hook for responsive design
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Limit to max items
  const displayTransactions = transactions.slice(0, maxItems);

  // Apply category mapping logic to transactions using getEffectiveCategory
  const transactionsWithCategories = useMemo(() => {
    return displayTransactions.map((transaction) => ({
      ...transaction,
      category: getEffectiveCategory(transaction),
    }));
  }, [displayTransactions]);

  // Calculate this week's summary
  const weekSummary = useMemo(() => {
    const txList = allTransactions || transactions;
    if (txList.length === 0) return null;

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

    // Filter transactions for this week
    const thisWeekTransactions = txList.filter((tx) => {
      const txDate = new Date(tx.date);
      return isWithinInterval(txDate, { start: weekStart, end: weekEnd });
    });

    if (thisWeekTransactions.length === 0) return null;

    // Calculate total (convert to display currency)
    const total = thisWeekTransactions.reduce((sum, tx) => {
      const converted = CurrencyService.convert(
        tx.amount,
        tx.currency,
        displayCurrency
      );
      return sum + converted;
    }, 0);

    // Calculate category breakdown
    const categoryTotals: Record<string, number> = {};
    thisWeekTransactions.forEach((tx) => {
      const category = getEffectiveCategory(tx);
      const converted = CurrencyService.convert(
        tx.amount,
        tx.currency,
        displayCurrency
      );
      categoryTotals[category] = (categoryTotals[category] || 0) + converted;
    });

    // Find top category
    let topCategory = "";
    let topAmount = 0;
    Object.entries(categoryTotals).forEach(([cat, amount]) => {
      if (amount > topAmount) {
        topCategory = cat;
        topAmount = amount;
      }
    });

    const topPercentage = total > 0 ? Math.round((topAmount / total) * 100) : 0;

    return {
      total,
      topCategory,
      topPercentage,
    };
  }, [allTransactions, transactions, displayCurrency]);

  // Render the empty state when no transactions are available
  const renderEmptyState = useCallback(() => {
    return (
      <div className="glass-card p-6 sm:p-8 text-center rounded-xl border border-border/50 bg-card hover:shadow-md transition-all">
        <p className="text-muted-foreground mb-4">
          No transactions recorded yet.
        </p>
        <Link to="/add-expense">
          <Button
            className={`btn-hover-effect bg-gradient-to-r from-[#00A651] to-[#10B981] ${!isMobile ? "gap-2" : "w-10 h-10 p-0"}`}
          >
            <PlusCircleIcon className={isMobile ? "h-4 w-4" : "mr-2 h-4 w-4"} />
            {!isMobile && <span>Record Your First Expense</span>}
          </Button>
        </Link>
      </div>
    );
  }, [isMobile]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#00A651] to-[#10B981]">
          Recent Transactions
        </h2>
        <Link
          to="/transactions"
          className="interactive-link text-primary flex items-center text-sm font-medium"
        >
          View All <ArrowUpRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {transactionsWithCategories.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {transactionsWithCategories.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                className="glass-card-elevated rounded-xl border border-border/50 bg-card hover:shadow-md hover:scale-[1.01] transition-all"
              />
            ))}
          </div>

          {/* Week Summary */}
          {weekSummary && (
            <div className="mt-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">This week:</span>{" "}
              {CurrencyService.format(weekSummary.total, displayCurrency)}
              {weekSummary.topCategory && (
                <>
                  {" "}
                  <span className="mx-1">•</span>{" "}
                  <span>
                    {weekSummary.topCategory}: {weekSummary.topPercentage}%
                  </span>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(RecentTransactions);
