// components/dashboard/layout/RecentTransactions.tsx
import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  format,
  isToday,
  isYesterday,
  startOfDay,
} from "date-fns";
import { Transaction, Currency, PaymentMethod } from "@/types";
import { Button } from "@/components/ui/button";
import {
  PlusCircleIcon,
  ArrowUpRightIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import { CurrencyService } from "@/core/currency";
import { TransactionDialog } from "@/components/expense/transaction/TransactionDialog";
import TransactionDeleteDialog from "@/components/transaction/TransactionDeleteDialog";
import { useTransactionActions } from "@/hooks/expense/useTransactionActions";

interface RecentTransactionsProps {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  displayCurrency?: Currency;
  maxItems?: number;
  paymentMethods?: PaymentMethod[];
}

interface GroupedTransaction {
  dateLabel: string;
  dateKey: string;
  transactions: Transaction[];
  total: number;
}

/**
 * Format date as "Today", "Yesterday", or "Dec 13"
 */
function formatTransactionDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

/**
 * Get date key for grouping (YYYY-MM-DD)
 */
function getDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(startOfDay(d), "yyyy-MM-dd");
}

/**
 * Format merchant name - show "Card Purchase" for unknown merchants
 */
function formatMerchantName(merchant: { name: string }): string {
  const name = merchant.name?.trim() || "";
  const lowerName = name.toLowerCase();

  // Check for unknown/empty merchant patterns
  if (
    !name ||
    lowerName === "unknown" ||
    lowerName === "unknown merchant" ||
    lowerName.startsWith("unknown ") ||
    lowerName === "n/a" ||
    lowerName === "na"
  ) {
    return "Card Purchase";
  }

  return name;
}

/**
 * Abbreviate points currency for compact display
 * Maps full program names to short abbreviations
 */
function abbreviatePointsCurrency(currency: string | undefined): string {
  if (!currency) return "pts";

  const lower = currency.toLowerCase();

  // Common abbreviation mappings
  const abbreviations: Record<string, string> = {
    "asia miles": "AM",
    asiamiles: "AM",
    krisflyer: "KF",
    "krisflyer miles": "KF",
    avios: "Avios",
    "membership rewards": "MR",
    mr: "MR",
    thankyou: "TY",
    "thankyou points": "TY",
    "citi thankyou": "TY",
    aeroplan: "AP",
    "aeroplan points": "AP",
    "scene+": "Scene+",
    "scene plus": "Scene+",
    "pc optimum": "PC",
    "air miles": "AM",
    "hsbc rewards": "HSBC",
    "rbc avion": "Avion",
    "td rewards": "TD",
    "amex points": "MR",
    "flying blue": "FB",
    "marriott bonvoy": "MB",
    velocity: "Vel",
    points: "pts",
    pts: "pts",
  };

  // Check for exact match first
  if (abbreviations[lower]) {
    return abbreviations[lower];
  }

  // Check for partial matches
  for (const [key, abbrev] of Object.entries(abbreviations)) {
    if (lower.includes(key)) {
      return abbrev;
    }
  }

  // Return first 2-3 chars uppercase if no match found
  if (currency.length <= 3) {
    return currency.toUpperCase();
  }
  return currency.slice(0, 3).toUpperCase();
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
  paymentMethods = [],
}) => {
  // Use the media query hook for responsive design
  const isMobile = useMediaQuery("(max-width: 768px)");

  // State for transaction dialog
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  const { handleDelete } = useTransactionActions();

  // Handle delete transaction
  const handleDeleteTransaction = useCallback((transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDeleteTransaction = useCallback(async () => {
    if (transactionToDelete) {
      const transactionObj = transactions.find(
        (t) => t.id === transactionToDelete
      );
      if (transactionObj) {
        await handleDelete(transactionObj);
      }
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
      setSelectedTransaction(null);
    }
  }, [transactionToDelete, transactions, handleDelete]);

  // Limit to max items
  const displayTransactions = transactions.slice(0, maxItems);

  // Group transactions by date
  const groupedTransactions = useMemo((): GroupedTransaction[] => {
    const groups: Map<string, GroupedTransaction> = new Map();

    displayTransactions.forEach((tx) => {
      const dateKey = getDateKey(tx.date);
      const dateLabel = formatTransactionDate(tx.date);
      const converted = CurrencyService.convert(
        tx.amount,
        tx.currency,
        displayCurrency
      );

      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          dateKey,
          dateLabel,
          transactions: [],
          total: 0,
        });
      }

      const group = groups.get(dateKey)!;
      group.transactions.push(tx);
      group.total += converted;
    });

    // Sort by date descending (most recent first)
    return Array.from(groups.values()).sort(
      (a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime()
    );
  }, [displayTransactions, displayCurrency]);

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
            className={`btn-hover-effect bg-primary hover:bg-primary/90 ${!isMobile ? "gap-2" : "w-10 h-10 p-0"}`}
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
        <h2 className="text-xl font-medium tracking-tight text-primary">
          Recent Transactions
        </h2>
        <Link
          to="/transactions"
          className="interactive-link text-primary flex items-center text-sm font-medium"
        >
          View All <ArrowUpRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>

      {groupedTransactions.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          {/* Date-Grouped Transaction List */}
          {groupedTransactions.map((group, groupIndex) => (
            <div key={group.dateKey}>
              {/* Date Header */}
              <div
                className={`flex items-center justify-between px-4 py-2 bg-muted/50 ${
                  groupIndex > 0 ? "border-t border-border/50" : ""
                }`}
              >
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {group.dateLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  {CurrencyService.format(group.total, displayCurrency)}
                </span>
              </div>

              {/* Transactions for this date */}
              <div className="divide-y divide-border/30">
                {group.transactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    onClick={() => setSelectedTransaction(transaction)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted/70 transition-colors group w-full text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-foreground truncate block">
                        {formatMerchantName(transaction.merchant)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getEffectiveCategory(transaction)}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-medium text-foreground">
                        {CurrencyService.format(
                          transaction.amount,
                          transaction.currency
                        )}
                      </div>
                      {transaction.rewardPoints > 0 && (
                        <div className="text-xs text-primary">
                          +{transaction.rewardPoints.toLocaleString()}{" "}
                          {abbreviatePointsCurrency(
                            transaction.paymentMethod?.pointsCurrency
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Week Summary */}
          {weekSummary && (
            <div className="px-4 py-3 border-t border-border/50 text-sm text-muted-foreground bg-muted/30">
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
        </div>
      )}

      {/* Transaction Dialog */}
      <TransactionDialog
        transaction={selectedTransaction}
        paymentMethods={paymentMethods}
        isOpen={selectedTransaction !== null}
        onClose={() => setSelectedTransaction(null)}
        onTransactionUpdated={(updated) => setSelectedTransaction(updated)}
        onDelete={handleDeleteTransaction}
      />

      <TransactionDeleteDialog
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={confirmDeleteTransaction}
      />
    </div>
  );
};

export default React.memo(RecentTransactions);
