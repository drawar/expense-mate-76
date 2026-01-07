// components/dashboard/cards/SpendByCardCard.tsx
import React from "react";
import { CreditCardIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruncatedText } from "@/components/ui/truncated-text";
import { CurrencyService } from "@/core/currency";

interface SpendByCardCardProps {
  transactions: Transaction[];
  displayCurrency?: Currency;
  className?: string;
}

interface SpendByCard {
  cardId: string;
  cardName: string;
  imageUrl: string | null;
  issuer: string;
  spending: number;
  currency: Currency;
}

/**
 * Card component that displays aggregated spend per payment method
 * Uses the same layout as PointsEarnedCard
 */
const SpendByCardCard: React.FC<SpendByCardCardProps> = ({
  transactions,
  displayCurrency = "CAD",
  className = "",
}) => {
  // Aggregate spending by payment method (credit cards only)
  const spendByCard = React.useMemo(() => {
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

      // Only include credit cards (exclude cash and adjustments)
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

      // Use paymentAmount (in card's native currency)
      const spending = tx.paymentAmount;

      cardMap.set(cardId, {
        ...existing,
        spending: existing.spending + spending,
      });
    });

    // Convert to array and sort by spending (descending)
    return Array.from(cardMap.entries())
      .map(
        ([cardId, data]): SpendByCard => ({
          cardId,
          cardName: data.cardName,
          imageUrl: data.imageUrl,
          issuer: data.issuer,
          spending: data.spending,
          currency: data.currency,
        })
      )
      .sort((a, b) => b.spending - a.spending);
  }, [transactions]);

  // Hide when no spending data
  if (spendByCard.length === 0) {
    return null;
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5 text-primary" />
          Spend by Card
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {spendByCard.map((item) => (
            <div
              key={item.cardId}
              className="flex items-center justify-between py-2"
            >
              {/* Card Image and Name */}
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                {/* Card Image */}
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.cardName}
                    className="h-[37px] w-[58px] object-contain flex-shrink-0 rounded-sm"
                  />
                ) : (
                  <div className="h-[37px] w-[58px] bg-muted flex items-center justify-center flex-shrink-0 rounded-sm">
                    <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                {/* Card Name and Issuer */}
                <div className="min-w-0">
                  <TruncatedText text={item.cardName} />
                  <p className="text-sm text-muted-foreground truncate">
                    {item.issuer}
                  </p>
                </div>
              </div>

              {/* Spending Amount */}
              <div className="text-right">
                <p className="font-medium text-[var(--color-error)]">
                  -{CurrencyService.format(item.spending, item.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(SpendByCardCard);
