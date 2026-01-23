// components/dashboard/layout/ActivitySection.tsx
/**
 * Combined Activity Section for Desktop
 * Tabbed interface: Transactions | Merchants | Cards
 */

import React, { useCallback, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parseISO, format, isToday, isYesterday, startOfDay } from "date-fns";
import { Transaction, Currency, PaymentMethod } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClockIcon,
  StoreIcon,
  CreditCardIcon,
  ChevronRightIcon,
  Plus,
  CoinsIcon,
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

interface PointsByCurrency {
  currency: string;
  points: number;
  spending: number;
  earnRate: number;
  logoUrl?: string;
  bgColor?: string;
  logoScale?: number;
  paymentCurrency?: string;
}

/**
 * Get short name for loyalty program display
 */
function getShortName(currency: string): string {
  const lower = currency.toLowerCase();

  const shortNames: Record<string, string> = {
    "asia miles": "Asia Miles",
    "citi thankyou points (sg)": "Citi TY",
    "citi thankyou points": "Citi TY",
    "aeroplan points": "Aeroplan",
    "membership rewards points (ca)": "MR (CA)",
    "membership rewards points": "MR",
    "membership rewards (ca)": "MR (CA)",
    "dbs points": "DBS",
    "hsbc rewards points": "HSBC",
    ocbc$: "OCBC$",
    "amazon rewards points": "Amazon",
    "flying blue miles": "Flying Blue",
    "flying blue": "Flying Blue",
  };

  for (const [key, name] of Object.entries(shortNames)) {
    if (lower.includes(key) || lower === key) {
      return name;
    }
  }

  if (currency.length > 15) {
    return currency.slice(0, 12) + "...";
  }
  return currency;
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

  // Get recent transactions (last 8 for better tab content)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .slice(0, 8);
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

  // Aggregate frequent merchants (show more in tab view)
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
      .slice(0, 6);
  }, [transactions]);

  // Aggregate spend by card (show more in tab view)
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
      .sort((a, b) => b.spending - a.spending);
  }, [transactions]);

  // Aggregate points by loyalty program
  const pointsByCurrency = useMemo(() => {
    const currencyMap = new Map<
      string,
      {
        points: number;
        spending: number;
        logoUrl?: string;
        bgColor?: string;
        logoScale?: number;
        paymentCurrency?: string;
      }
    >();

    transactions.forEach((tx) => {
      if (tx.rewardPoints <= 0) return;

      const pointsCurrency = tx.paymentMethod?.pointsCurrency || "Points";
      const existing = currencyMap.get(pointsCurrency) || {
        points: 0,
        spending: 0,
        logoUrl: undefined,
        bgColor: undefined,
        logoScale: undefined,
        paymentCurrency: undefined,
      };

      const spending = tx.paymentAmount ?? tx.amount;
      const paymentCurrency = tx.paymentCurrency ?? tx.currency;

      currencyMap.set(pointsCurrency, {
        points: existing.points + tx.rewardPoints,
        spending: existing.spending + spending,
        logoUrl: existing.logoUrl || tx.paymentMethod?.rewardCurrencyLogoUrl,
        bgColor: existing.bgColor || tx.paymentMethod?.rewardCurrencyBgColor,
        logoScale:
          existing.logoScale || tx.paymentMethod?.rewardCurrencyLogoScale,
        paymentCurrency: existing.paymentCurrency || paymentCurrency,
      });
    });

    return Array.from(currencyMap.entries())
      .map(
        ([currency, data]): PointsByCurrency => ({
          currency,
          points: data.points,
          spending: data.spending,
          earnRate: data.spending > 0 ? data.points / data.spending : 0,
          logoUrl: data.logoUrl,
          bgColor: data.bgColor,
          logoScale: data.logoScale,
          paymentCurrency: data.paymentCurrency,
        })
      )
      .sort((a, b) => b.points - a.points);
  }, [transactions]);

  // Calculate total points and max for bar chart
  const totalPoints = useMemo(
    () => pointsByCurrency.reduce((sum, item) => sum + item.points, 0),
    [pointsByCurrency]
  );
  const maxPoints = useMemo(
    () => Math.max(...pointsByCurrency.map((p) => p.points), 1),
    [pointsByCurrency]
  );

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
    <Card className={`rounded-xl border border-border/50 bg-card ${className}`}>
      <Tabs defaultValue="transactions" className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="transactions" className="gap-1.5">
                <ClockIcon className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="merchants" className="gap-1.5">
                <StoreIcon className="h-4 w-4" />
                Merchants
              </TabsTrigger>
              <TabsTrigger value="cards" className="gap-1.5">
                <CreditCardIcon className="h-4 w-4" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="loyalty" className="gap-1.5">
                <CoinsIcon className="h-4 w-4" />
                Loyalty Programs
              </TabsTrigger>
            </TabsList>
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
          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-0">
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
          </TabsContent>

          {/* Merchants Tab */}
          <TabsContent value="merchants" className="mt-0">
            {merchantStats.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No merchant data available
              </p>
            ) : (
              <div className="space-y-2">
                {merchantStats.map((merchant) => (
                  <div
                    key={merchant.name}
                    className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="font-medium truncate">{merchant.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {merchant.count} transactions
                      </p>
                    </div>
                    <div className="text-right mr-3">
                      <p className="font-medium">
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
                            className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
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
            )}
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="mt-0">
            {spendByCard.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No card spending data available
              </p>
            ) : (
              <div className="space-y-2">
                {spendByCard.map((card) => (
                  <div
                    key={card.cardId}
                    className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.cardName}
                          className="h-8 w-12 object-contain flex-shrink-0 rounded-sm"
                        />
                      ) : (
                        <div className="h-8 w-12 bg-muted flex items-center justify-center flex-shrink-0 rounded-sm">
                          <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium truncate">{card.cardName}</p>
                        <p className="text-xs text-muted-foreground">
                          {card.issuer}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-foreground">
                      {CurrencyService.format(card.spending, card.currency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty" className="mt-0">
            {pointsByCurrency.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No points earned this period
              </p>
            ) : (
              <div className="space-y-3">
                {/* Total points header */}
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    {pointsByCurrency.length} programs
                  </span>
                  <div className="text-right">
                    <span className="text-xl font-semibold text-primary">
                      +{totalPoints.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      total
                    </span>
                  </div>
                </div>

                {/* Bar chart */}
                <div className="space-y-2">
                  {pointsByCurrency.map((item) => {
                    const barWidth = (item.points / maxPoints) * 100;
                    const currencySymbol =
                      item.paymentCurrency === "SGD"
                        ? "S$"
                        : item.paymentCurrency === "CAD"
                          ? "C$"
                          : item.paymentCurrency === "USD"
                            ? "$"
                            : item.paymentCurrency || "$";

                    return (
                      <TooltipProvider key={item.currency}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-3 group cursor-default">
                              {/* Logo */}
                              {item.logoUrl ? (
                                <div
                                  className="h-8 w-8 min-w-[32px] flex items-center justify-center rounded-full overflow-hidden flex-shrink-0"
                                  style={{
                                    backgroundColor: item.bgColor || "#ffffff",
                                  }}
                                >
                                  <img
                                    src={item.logoUrl}
                                    alt={item.currency}
                                    className="w-full h-full object-contain"
                                    style={
                                      item.logoScale
                                        ? {
                                            transform: `scale(${item.logoScale})`,
                                          }
                                        : undefined
                                    }
                                  />
                                </div>
                              ) : (
                                <div className="h-8 w-8 min-w-[32px] rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                  <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}

                              {/* Name */}
                              <span className="text-sm w-20 truncate flex-shrink-0">
                                {getShortName(item.currency)}
                              </span>

                              {/* Bar */}
                              <div className="flex-1 h-6 bg-muted/50 rounded overflow-hidden relative">
                                <div
                                  className="h-full bg-primary/20 group-hover:bg-primary/30 transition-colors rounded"
                                  style={{ width: `${barWidth}%` }}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm font-medium">
                                  +{item.points.toLocaleString()}
                                </span>
                              </div>

                              {/* Earn rate badge */}
                              <span className="text-xs text-muted-foreground w-14 text-right flex-shrink-0">
                                {item.earnRate.toFixed(1)}/{currencySymbol}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              <p className="font-medium">{item.currency}</p>
                              <p>
                                {item.points.toLocaleString()} points from{" "}
                                {currencySymbol}
                                {item.spending.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                spent
                              </p>
                              <p className="text-muted-foreground">
                                Earn rate: {item.earnRate.toFixed(2)} pts/
                                {currencySymbol}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>

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
    </Card>
  );
};

export default React.memo(ActivitySection);
