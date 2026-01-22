// components/dashboard/layout/ActivitySection.tsx
/**
 * Combined Activity Section for Desktop
 * Merges Recent Transactions, Frequent Merchants, and Spend by Card
 * into a two-column layout
 */

import React, { useCallback, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parseISO, format, isToday, isYesterday, startOfDay } from "date-fns";
import { Transaction, Currency, PaymentMethod } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClockIcon,
  StoreIcon,
  CreditCardIcon,
  ChevronRightIcon,
  Plus,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getEffectiveCategory } from "@/utils/categoryMapping";
import { CurrencyService } from "@/core/currency";
import { TransactionDialog } from "@/components/expense/transaction/TransactionDialog";
import TransactionDeleteDialog from "@/components/transaction/TransactionDeleteDialog";
import { useTransactionActions } from "@/hooks/expense/useTransactionActions";

interface ActivitySectionProps {
  transactions: Transaction[];
  allTransactions?: Transaction[];
  displayCurrency: Currency;
  paymentMethods?: PaymentMethod[];
  className?: string;
}

/**
 * Format date as "Today", "Yesterday", or "Jan 20"
 */
function formatTransactionDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

/**
 * Get date key for grouping
 */
function getDateKey(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(startOfDay(d), "yyyy-MM-dd");
}

/**
 * Format merchant name
 */
function formatMerchantName(merchant: { name: string }): string {
  const name = merchant.name?.trim() || "";
  const lowerName = name.toLowerCase();

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
 * Abbreviate points currency
 */
function abbreviatePointsCurrency(currency: string | undefined): string {
  if (!currency) return "pts";

  const abbreviations: Record<string, string> = {
    "asia miles": "AM",
    krisflyer: "KF",
    "membership rewards": "MR",
    thankyou: "TY",
    aeroplan: "AP",
    "flying blue": "FB",
    ocbc$: "OCBC$",
    points: "pts",
  };

  const lower = currency.toLowerCase();
  for (const [key, abbrev] of Object.entries(abbreviations)) {
    if (lower.includes(key)) {
      return abbrev;
    }
  }

  return currency.length <= 3
    ? currency.toUpperCase()
    : currency.slice(0, 3).toUpperCase();
}

interface MerchantStats {
  name: string;
  count: number;
  totalSpent: number;
  mccCode?: string;
  currency: Currency;
}

interface SpendByCard {
  cardId: string;
  cardName: string;
  imageUrl: string | null;
  issuer: string;
  spending: number;
  currency: Currency;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({
  transactions,
  allTransactions = [],
  displayCurrency,
  paymentMethods = [],
  className = "",
}) => {
  const navigate = useNavigate();
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  const { handleDelete, handleUpdate } = useTransactionActions();

  // Get recent transactions (last 5)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = new Map<
      string,
      { dateLabel: string; transactions: Transaction[] }
    >();

    recentTransactions.forEach((tx) => {
      const dateKey = getDateKey(tx.date);
      const existing = groups.get(dateKey);

      if (existing) {
        existing.transactions.push(tx);
      } else {
        groups.set(dateKey, {
          dateLabel: formatTransactionDate(tx.date),
          transactions: [tx],
        });
      }
    });

    return Array.from(groups.values());
  }, [recentTransactions]);

  // Aggregate frequent merchants
  const merchantStats = useMemo(() => {
    const statsMap = new Map<string, MerchantStats>();

    transactions.forEach((tx) => {
      const merchantName = tx.merchant?.name?.trim();
      if (!merchantName) return;

      const key = merchantName.toLowerCase();
      const existing = statsMap.get(key);

      if (existing) {
        if (existing.currency === tx.currency) {
          existing.totalSpent += tx.amount;
        } else {
          existing.totalSpent += tx.convertedAmount ?? tx.amount;
        }
        existing.count += 1;
        if (tx.merchant?.mcc?.code) {
          existing.mccCode = tx.merchant.mcc.code;
        }
      } else {
        statsMap.set(key, {
          name: merchantName,
          count: 1,
          totalSpent: tx.amount,
          mccCode: tx.merchant?.mcc?.code,
          currency: tx.currency,
        });
      }
    });

    return Array.from(statsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [transactions]);

  // Aggregate spend by card
  const spendByCard = useMemo(() => {
    const cardMap = new Map<
      string,
      {
        cardName: string;
        imageUrl: string | null;
        issuer: string;
        spending: number;
        currency: Currency;
      }
    >();

    transactions.forEach((tx) => {
      if (!tx.paymentMethod) return;
      if (tx.paymentMethod.type !== "credit_card") return;
      if (tx.paymentMethod.name.toLowerCase().includes("adjustment")) return;

      const cardId = tx.paymentMethod.id;
      const cardCurrency = tx.paymentMethod.currency;
      const existing = cardMap.get(cardId) || {
        cardName: tx.paymentMethod.nickname || tx.paymentMethod.name,
        imageUrl: tx.paymentMethod.imageUrl || null,
        issuer: tx.paymentMethod.issuer,
        spending: 0,
        currency: cardCurrency,
      };

      cardMap.set(cardId, {
        ...existing,
        spending: existing.spending + tx.paymentAmount,
      });
    });

    return Array.from(cardMap.entries())
      .map(
        ([cardId, data]): SpendByCard => ({
          cardId,
          ...data,
        })
      )
      .sort((a, b) => b.spending - a.spending)
      .slice(0, 4);
  }, [transactions]);

  // Build URL for quick add
  const buildAddExpenseUrl = (merchant: MerchantStats): string => {
    const params = new URLSearchParams();
    params.set("merchantName", merchant.name);
    if (merchant.mccCode) {
      params.set("mccCode", merchant.mccCode);
    }
    return `/add-expense?${params.toString()}`;
  };

  // Handle transaction click
  const handleTransactionClick = useCallback((tx: Transaction) => {
    setSelectedTransaction(tx);
  }, []);

  // Handle delete
  const handleDeleteTransaction = useCallback((transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (transactionToDelete) {
      const tx = allTransactions.find((t) => t.id === transactionToDelete);
      if (tx) {
        await handleDelete(tx);
      }
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
      setSelectedTransaction(null);
    }
  }, [transactionToDelete, allTransactions, handleDelete]);

  return (
    <div className={`grid grid-cols-12 gap-4 ${className}`}>
      {/* Left: Recent Transactions (8 cols) */}
      <Card className="col-span-8 rounded-xl border border-border/50 bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
            <Link
              to="/transactions"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {groupedTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No recent transactions
            </p>
          ) : (
            <div className="space-y-4">
              {groupedTransactions.map((group) => (
                <div key={group.dateLabel}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {group.dateLabel}
                  </p>
                  <div className="space-y-1">
                    {group.transactions.map((tx) => (
                      <button
                        key={tx.id}
                        onClick={() => handleTransactionClick(tx)}
                        className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {formatMerchantName(tx.merchant)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getEffectiveCategory(tx)}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">
                            {CurrencyService.format(tx.amount, tx.currency)}
                          </p>
                          {tx.rewardPoints > 0 && (
                            <p className="text-xs text-primary">
                              +{tx.rewardPoints}{" "}
                              {abbreviatePointsCurrency(
                                tx.paymentMethod?.pointsCurrency
                              )}
                            </p>
                          )}
                        </div>
                        <ChevronRightIcon className="h-4 w-4 text-muted-foreground ml-2" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right: Frequent Merchants + Spend by Card (4 cols) */}
      <div className="col-span-4 space-y-4">
        {/* Frequent Merchants */}
        {merchantStats.length > 0 && (
          <Card className="rounded-xl border border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <StoreIcon className="h-4 w-4 text-primary" />
                Frequent Merchants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {merchantStats.map((merchant) => (
                  <div
                    key={merchant.name}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-sm font-medium truncate">
                        {merchant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {merchant.count} txns
                      </p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-sm font-medium">
                        {CurrencyService.format(
                          merchant.totalSpent,
                          merchant.currency
                        )}
                      </p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={buildAddExpenseUrl(merchant)}
                            className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>Add {merchant.name} expense</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Spend by Card */}
        {spendByCard.length > 0 && (
          <Card className="rounded-xl border border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCardIcon className="h-4 w-4 text-primary" />
                Spend by Card
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {spendByCard.map((card) => (
                  <div
                    key={card.cardId}
                    className="flex items-center justify-between py-1.5"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.cardName}
                          className="h-6 w-10 object-contain flex-shrink-0 rounded-sm"
                        />
                      ) : (
                        <div className="h-6 w-10 bg-muted flex items-center justify-center flex-shrink-0 rounded-sm">
                          <CreditCardIcon className="h-3 w-3 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {card.cardName}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-error)]">
                      -{CurrencyService.format(card.spending, card.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
        onConfirmDelete={confirmDelete}
      />
    </div>
  );
};

export default React.memo(ActivitySection);
