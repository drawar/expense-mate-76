// components/dashboard/cards/PointsEarnedCardDesktop.tsx
/**
 * Desktop-optimized Points Earned Card
 * Horizontal layout with hero total and compact program badges
 */

import React, { useState } from "react";
import { CoinsIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface PointsEarnedCardDesktopProps {
  transactions: Transaction[];
  displayCurrency?: Currency;
  className?: string;
  /** Enable collapsible behavior */
  collapsible?: boolean;
  /** Start collapsed */
  defaultCollapsed?: boolean;
  /** Max items to show when collapsed */
  maxItems?: number;
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
 */
function abbreviatePointsCurrency(currency: string | undefined): string {
  if (!currency) return "pts";

  const lower = currency.toLowerCase();

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

  if (abbreviations[lower]) {
    return abbreviations[lower];
  }

  for (const [key, abbrev] of Object.entries(abbreviations)) {
    if (lower.includes(key)) {
      return abbrev;
    }
  }

  if (currency.length <= 3) {
    return currency.toUpperCase();
  }
  return currency.slice(0, 3).toUpperCase();
}

/**
 * Get short name for display
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

  // Truncate long names
  if (currency.length > 15) {
    return currency.slice(0, 12) + "...";
  }
  return currency;
}

/**
 * Desktop Points Earned Card with horizontal layout
 */
const PointsEarnedCardDesktop: React.FC<PointsEarnedCardDesktopProps> = ({
  transactions,
  displayCurrency = "CAD",
  className = "",
  collapsible = false,
  defaultCollapsed = false,
  maxItems = 5,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  // Aggregate points and spending by currency
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

  // Calculate total points
  const totalPoints = React.useMemo(
    () => pointsByCurrency.reduce((sum, item) => sum + item.points, 0),
    [pointsByCurrency]
  );

  // Hide when no points earned
  if (pointsByCurrency.length === 0) {
    return null;
  }

  // Calculate max points for relative bar widths
  const maxPoints = Math.max(...pointsByCurrency.map((p) => p.points));

  // Determine which items to display based on collapsed state
  const displayItems =
    collapsible && isCollapsed
      ? pointsByCurrency.slice(0, maxItems)
      : pointsByCurrency;
  const hiddenCount = pointsByCurrency.length - maxItems;
  const hasMore = collapsible && hiddenCount > 0;

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <CoinsIcon className="h-5 w-5 text-primary" />
            Points Earned
            {collapsible && (
              <span className="text-sm font-normal text-muted-foreground">
                ({pointsByCurrency.length} programs)
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-2xl font-semibold text-primary">
                +{totalPoints.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground ml-1">total</span>
            </div>
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronUpIcon className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Horizontal bar chart style */}
        <div className="space-y-2">
          {displayItems.map((item) => {
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
                          style={{ backgroundColor: item.bgColor || "#ffffff" }}
                        >
                          <img
                            src={item.logoUrl}
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
                        <div className="h-8 w-8 min-w-[32px] rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}

                      {/* Name */}
                      <span className="text-sm w-24 truncate flex-shrink-0">
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
                      <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0">
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
                        Earn rate: {item.earnRate.toFixed(2)}{" "}
                        {abbreviatePointsCurrency(item.currency)}/
                        {currencySymbol}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(PointsEarnedCardDesktop);
