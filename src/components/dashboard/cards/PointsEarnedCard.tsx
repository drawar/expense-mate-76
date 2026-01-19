// components/dashboard/cards/PointsEarnedCard.tsx
import React from "react";
import { CoinsIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TruncatedText } from "@/components/ui/truncated-text";
import { CurrencyService } from "@/core/currency";

interface PointsEarnedCardProps {
  transactions: Transaction[];
  displayCurrency?: Currency;
  className?: string;
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
 * Abbreviate points currency for compact display
 * Maps full program names to short abbreviations
 * (Same logic as RecentTransactions)
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
    ocbc$: "OCBC$",
    "ocbc dollars": "OCBC$",
    ocbc: "OCBC$",
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
 * Card component that displays points earned by currency with earn rates
 */
const PointsEarnedCard: React.FC<PointsEarnedCardProps> = ({
  transactions,
  displayCurrency = "CAD",
  className = "",
}) => {
  // Aggregate points and spending by currency
  // Use paymentAmount (card's statement currency) for earn rate calculation
  const pointsByCurrency = React.useMemo(() => {
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

      // Use paymentAmount (in card's currency) for earn rate calculation
      // Points are earned based on the statement amount, not transaction amount
      const spending = tx.paymentAmount ?? tx.amount;
      const paymentCurrency = tx.paymentCurrency ?? tx.currency;

      currencyMap.set(pointsCurrency, {
        points: existing.points + tx.rewardPoints,
        spending: existing.spending + spending,
        // Capture logo_url, bg_color, and logo_scale from reward_currencies (use first one found)
        logoUrl: existing.logoUrl || tx.paymentMethod?.rewardCurrencyLogoUrl,
        bgColor: existing.bgColor || tx.paymentMethod?.rewardCurrencyBgColor,
        logoScale:
          existing.logoScale || tx.paymentMethod?.rewardCurrencyLogoScale,
        // Track the payment currency for this points type
        paymentCurrency: existing.paymentCurrency || paymentCurrency,
      });
    });

    // Convert to array, calculate earn rate, and sort by points (descending)
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

  // Hide when no points earned
  if (pointsByCurrency.length === 0) {
    return null;
  }

  // Get currency symbol for display
  const currencySymbol =
    displayCurrency === "CAD"
      ? "C$"
      : displayCurrency === "SGD"
        ? "S$"
        : displayCurrency === "USD"
          ? "$"
          : displayCurrency;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <CoinsIcon className="h-5 w-5 text-primary" />
          Points Earned
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {pointsByCurrency.map((item) => {
            const logoUrl = item.logoUrl;
            const bgColor = item.bgColor;
            return (
              <div
                key={item.currency}
                className="flex items-center justify-between py-2"
              >
                {/* Logo and Currency Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                  {/* Loyalty Program Logo */}
                  {logoUrl ? (
                    <div
                      className="h-[37px] w-[37px] min-w-[37px] flex items-center justify-center rounded-full overflow-hidden flex-shrink-0"
                      style={{ backgroundColor: bgColor || "#ffffff" }}
                    >
                      <img
                        src={logoUrl}
                        alt={item.currency}
                        className="w-full h-full object-contain"
                        style={
                          item.logoScale
                            ? { transform: `scale(${item.logoScale})` }
                            : undefined
                        }
                      />
                    </div>
                  ) : (
                    <div className="h-[37px] w-[37px] min-w-[37px] rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <CoinsIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Currency Name and Earn Rate */}
                  <div className="min-w-0">
                    <TruncatedText text={item.currency} />
                    <p className="text-sm text-muted-foreground">
                      {item.earnRate.toFixed(1)}{" "}
                      {abbreviatePointsCurrency(item.currency)}/
                      {item.paymentCurrency === "SGD"
                        ? "S$"
                        : item.paymentCurrency === "CAD"
                          ? "C$"
                          : item.paymentCurrency === "USD"
                            ? "$"
                            : item.paymentCurrency || currencySymbol}
                    </p>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="font-medium text-primary">
                    +{item.points.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(PointsEarnedCard);
