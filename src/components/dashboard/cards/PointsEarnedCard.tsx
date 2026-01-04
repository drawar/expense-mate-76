// components/dashboard/cards/PointsEarnedCard.tsx
import React from "react";
import { CoinsIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

// Loyalty program logo URLs from Supabase storage
const LOYALTY_PROGRAM_LOGOS: Record<string, string> = {
  krisflyer:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/krisflyer.png",
  "krisflyer miles":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/krisflyer.png",
  avios:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/avios.png",
  "membership rewards":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/membership-rewards.png",
  "membership rewards points (ca)":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/amex-mr.png",
  "hsbc rewards":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/hsbc-rewards.png",
  "hsbc rewards points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/hsbc-rewards.png",
  "td rewards":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/td-rewards.png",
  "citi thankyou":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  "citi thankyou points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  thankyou:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  "thankyou points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  "asia miles":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/cx-asiamiles.png",
  asiamiles:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/cx-asiamiles.png",
  "amazon rewards":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/amazon-rewards.png",
  "flying blue":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  flyingblue:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  "flying blue miles":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  "flying blue points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  aeroplan:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/ac-aeroplan.png",
  "aeroplan points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/ac-aeroplan.png",
};

/**
 * Get logo URL for a loyalty program
 */
function getLoyaltyProgramLogo(currency: string | undefined): string | null {
  if (!currency) return null;
  return LOYALTY_PROGRAM_LOGOS[currency.toLowerCase()] || null;
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
  const pointsByCurrency = React.useMemo(() => {
    const currencyMap = new Map<string, { points: number; spending: number }>();

    transactions.forEach((tx) => {
      if (tx.rewardPoints <= 0) return;

      const pointsCurrency = tx.paymentMethod?.pointsCurrency || "Points";
      const existing = currencyMap.get(pointsCurrency) || {
        points: 0,
        spending: 0,
      };

      // Convert spending to display currency
      const spending = CurrencyService.convert(
        tx.amount,
        tx.currency as Currency,
        displayCurrency,
        tx.paymentMethod
      );

      currencyMap.set(pointsCurrency, {
        points: existing.points + tx.rewardPoints,
        spending: existing.spending + spending,
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
        })
      )
      .sort((a, b) => b.points - a.points);
  }, [transactions, displayCurrency]);

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
            const logoUrl = getLoyaltyProgramLogo(item.currency);
            return (
              <div
                key={item.currency}
                className="flex items-center justify-between py-2"
              >
                {/* Logo and Currency Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                  {/* Loyalty Program Logo */}
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={item.currency}
                      className="h-8 w-8 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}

                  {/* Currency Name and Earn Rate */}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.currency}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.earnRate.toFixed(1)}{" "}
                      {abbreviatePointsCurrency(item.currency)}/{currencySymbol}
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
