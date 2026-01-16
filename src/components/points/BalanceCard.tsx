/**
 * BalanceCard - Displays a single currency balance with logo and breakdown
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CoinsIcon,
  Edit2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { PointsBalance, BalanceBreakdown, getCppRating } from "@/core/points";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  balance: PointsBalance;
  breakdown?: BalanceBreakdown;
  averageCpp?: number;
  onEditStartingBalance?: () => void;
  cardImageUrl?: string; // Card face image for card-specific balances
  className?: string;
}

export function BalanceCard({
  balance,
  breakdown,
  averageCpp,
  onEditStartingBalance,
  cardImageUrl,
  className,
}: BalanceCardProps) {
  const currencyName = balance.rewardCurrency?.displayName ?? "Points";
  const logoUrl = balance.rewardCurrency?.logoUrl;
  const bgColor = balance.rewardCurrency?.bgColor;
  const logoScale = balance.rewardCurrency?.logoScale;
  // Card-specific balances have either paymentMethodId (new) or cardTypeId (legacy)
  const isCardSpecific = !!balance.paymentMethodId || !!balance.cardTypeId;

  const formatNumber = (num: number) => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Mini card image for card-specific balances - top left corner */}
      {isCardSpecific && cardImageUrl && (
        <div className="absolute top-3 left-3 z-10">
          <div className="w-12 h-[30px] rounded shadow-md overflow-hidden border border-border/50 bg-background">
            <img
              src={cardImageUrl}
              alt="Card"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Expiry Badge - positioned absolute top right */}
      {balance.expiryDate && (
        <Badge
          variant="outline"
          className="absolute top-1.5 right-1.5 text-[10px] font-normal bg-background/80 backdrop-blur-sm py-0.5 px-1.5"
        >
          <Clock className="h-2.5 w-2.5 mr-0.5" />
          Expires {format(balance.expiryDate, "MMM d, yyyy")}
        </Badge>
      )}

      <CardContent
        className={cn("pt-6", isCardSpecific && cardImageUrl && "pt-12")}
      >
        {/* Header with logo and currency name */}
        <div className="flex items-center gap-3 mb-4">
          {logoUrl ? (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: bgColor || "#ffffff" }}
            >
              <img
                src={logoUrl}
                alt={currencyName}
                className="w-10 h-10 object-contain"
                style={
                  logoScale ? { transform: `scale(${logoScale})` } : undefined
                }
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CoinsIcon className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground">{currencyName}</h3>
            {/* Only show issuer for pooled balances (no cardTypeName) */}
            {balance.rewardCurrency?.issuer && !balance.cardTypeName && (
              <p className="text-xs text-muted-foreground">
                {balance.rewardCurrency.issuer}
              </p>
            )}
            {balance.cardTypeName && (
              <p className="text-xs text-muted-foreground truncate">
                via {balance.cardTypeName}
              </p>
            )}
          </div>
          {onEditStartingBalance && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onEditStartingBalance}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Current Balance - always use calculated breakdown, never stored value */}
        <div className="mb-4">
          <p className="text-3xl font-semibold text-foreground">
            {breakdown ? formatNumber(breakdown.currentBalance) : "—"}
          </p>
        </div>

        {/* Balance Breakdown */}
        {breakdown && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Starting Balance</span>
              <span>{formatNumber(breakdown.startingBalance)}</span>
            </div>
            {breakdown.earnedFromTransactions > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  Earned
                </span>
                <span className="text-green-600">
                  +{formatNumber(breakdown.earnedFromTransactions)}
                </span>
              </div>
            )}
            {breakdown.adjustments !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  {breakdown.adjustments > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  Adjustments
                </span>
                <span
                  className={
                    breakdown.adjustments > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {breakdown.adjustments > 0 ? "+" : ""}
                  {formatNumber(breakdown.adjustments)}
                </span>
              </div>
            )}
            {breakdown.redemptions > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  Redeemed
                </span>
                <span className="text-red-600">
                  -{formatNumber(breakdown.redemptions)}
                </span>
              </div>
            )}
            {(breakdown.transfersOut > 0 || breakdown.transfersIn > 0) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ArrowRightLeft className="h-3 w-3" />
                  Transfers
                </span>
                <span
                  className={
                    breakdown.transfersIn - breakdown.transfersOut > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {breakdown.transfersIn - breakdown.transfersOut > 0
                    ? "+"
                    : ""}
                  {formatNumber(breakdown.transfersIn - breakdown.transfersOut)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Average CPP */}
        {averageCpp !== undefined && averageCpp > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Avg. Redemption Value
              </span>
              <CPPBadge cpp={averageCpp} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * CPPBadge - Color-coded CPP display
 */
interface CPPBadgeProps {
  cpp: number;
  className?: string;
}

export function CPPBadge({ cpp, className }: CPPBadgeProps) {
  const rating = getCppRating(cpp);

  const colorClasses = {
    excellent:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    great:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    good: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    poor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        colorClasses[rating],
        className
      )}
    >
      {cpp.toFixed(2)}cpp
    </span>
  );
}

export default BalanceCard;
