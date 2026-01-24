// components/dashboard/cards/TopCardsCard.tsx
/**
 * Top Cards Card showing total spend by card (top 5)
 * Same styling as TopMerchantsCard
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRightIcon, ArrowRightIcon, CreditCardIcon } from "lucide-react";
import { CurrencyService } from "@/core/currency";
import { useDashboardContext } from "@/contexts/DashboardContext";

interface TopCardsCardProps {
  transactions: Transaction[];
  displayCurrency: Currency;
  maxItems?: number;
  className?: string;
}

interface CardSpend {
  id: string;
  name: string;
  issuer: string;
  imageUrl: string | null;
  totalSpend: number;
  transactionCount: number;
  currency: Currency;
}

/**
 * Abbreviate card type names for compact display
 */
function abbreviateCardName(name: string): string {
  return name
    .replace(/Visa Infinite Privilege/gi, "VIP")
    .replace(/Visa Infinite/gi, "VI")
    .replace(/Visa Signature/gi, "VS")
    .replace(/Visa Platinum/gi, "VP")
    .replace(/World Elite Mastercard/gi, "WEMC")
    .replace(/World Mastercard/gi, "WMC");
}

const TopCardsCard: React.FC<TopCardsCardProps> = ({
  transactions,
  displayCurrency,
  maxItems = 5,
  className = "",
}) => {
  const { activeTab } = useDashboardContext();

  // Calculate date range based on active time filter
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (activeTab) {
      case "thisMonth":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "lastMonth":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case "lastTwoMonths":
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(now);
        break;
      case "lastThreeMonths":
        start = startOfMonth(subMonths(now, 2));
        end = endOfMonth(now);
        break;
      case "lastSixMonths":
        start = startOfMonth(subMonths(now, 5));
        end = endOfMonth(now);
        break;
      case "thisYear":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return {
      from: format(start, "yyyy-MM-dd"),
      to: format(end, "yyyy-MM-dd"),
    };
  }, [activeTab]);

  // Aggregate spending by card (exclude gift cards)
  const topCards = useMemo((): CardSpend[] => {
    const cardMap = new Map<string, CardSpend>();

    transactions.forEach((tx) => {
      if (!tx.paymentMethod?.id) return;

      // Exclude gift cards
      if (tx.paymentMethod.type === "gift_card") return;

      const cardId = tx.paymentMethod.id;
      const existing = cardMap.get(cardId);

      const grossAmount = CurrencyService.convert(
        tx.paymentAmount ?? tx.amount,
        tx.paymentCurrency ?? tx.currency,
        displayCurrency
      );
      const reimbursed = tx.reimbursementAmount
        ? CurrencyService.convert(
            tx.reimbursementAmount,
            tx.paymentCurrency ?? tx.currency,
            displayCurrency
          )
        : 0;
      const amount = grossAmount - reimbursed;

      if (existing) {
        existing.totalSpend += amount;
        existing.transactionCount++;
      } else {
        cardMap.set(cardId, {
          id: cardId,
          name:
            tx.paymentMethod.nickname ||
            tx.paymentMethod.name ||
            "Unknown Card",
          issuer: tx.paymentMethod.issuer || "",
          imageUrl: tx.paymentMethod.imageUrl || null,
          totalSpend: amount,
          transactionCount: 1,
          currency: displayCurrency,
        });
      }
    });

    return Array.from(cardMap.values())
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, maxItems);
  }, [transactions, displayCurrency, maxItems]);

  return (
    <Card className={`rounded-xl border border-border/50 bg-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Spending by Card</CardTitle>
          <Link
            to="/transactions"
            className="group flex items-center gap-1 text-sm text-primary"
          >
            <span className="relative">
              View All
              <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-primary transition-all duration-300 group-hover:w-full" />
            </span>
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        {topCards.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No card data available
          </p>
        ) : (
          <div className="space-y-1">
            {topCards.map((card) => (
              <Link
                key={card.id}
                to={`/transactions?from=${dateRange.from}&to=${dateRange.to}&card=${encodeURIComponent(card.id)}`}
                className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {card.imageUrl ? (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="h-8 w-12 object-contain flex-shrink-0 rounded-sm"
                    />
                  ) : (
                    <div className="h-8 w-12 bg-muted flex items-center justify-center flex-shrink-0 rounded-sm">
                      <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {abbreviateCardName(card.name)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {card.issuer}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">
                    {CurrencyService.format(card.totalSpend, card.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {card.transactionCount}{" "}
                    {card.transactionCount === 1
                      ? "transaction"
                      : "transactions"}
                  </p>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-muted-foreground ml-2" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(TopCardsCard);
