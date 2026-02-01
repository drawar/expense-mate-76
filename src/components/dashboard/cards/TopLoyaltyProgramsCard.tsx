// components/dashboard/cards/TopLoyaltyProgramsCard.tsx
/**
 * Top Loyalty Programs Card showing points earned by program (top 5)
 * Same styling as TopMerchantsCard
 */

import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Transaction, Currency } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRightIcon, ArrowRightIcon, CoinsIcon } from "lucide-react";

interface TopLoyaltyProgramsCardProps {
  transactions: Transaction[];
  displayCurrency: Currency;
  maxItems?: number;
  className?: string;
}

interface ProgramPoints {
  name: string;
  points: number;
  transactionCount: number;
  logoUrl?: string;
  bgColor?: string;
  logoScale?: number;
}

/**
 * Get short name for loyalty program display
 */
function getShortName(currency: string): string {
  const lower = currency.toLowerCase();

  const shortNames: Record<string, string> = {
    "membership rewards": "Membership Rewards",
    "thankyou points": "ThankYou Points",
    "krisflyer miles": "KrisFlyer",
    "asia miles": "Asia Miles",
    "aeroplan points": "Aeroplan",
    "flying blue": "Flying Blue",
    avios: "Avios",
    "marriott bonvoy": "Marriott Bonvoy",
    velocity: "Velocity",
    "scene+": "Scene+",
  };

  for (const [key, name] of Object.entries(shortNames)) {
    if (lower.includes(key)) {
      return name;
    }
  }

  return currency;
}

const TopLoyaltyProgramsCard: React.FC<TopLoyaltyProgramsCardProps> = ({
  transactions,
  maxItems = 5,
  className = "",
}) => {
  // Aggregate points by loyalty program
  const topPrograms = useMemo((): ProgramPoints[] => {
    const programMap = new Map<string, ProgramPoints>();

    transactions.forEach((tx) => {
      // Skip transactions with no reward points (0)
      if (tx.rewardPoints === 0) return;

      const programName = tx.paymentMethod?.pointsCurrency || "Points";
      const existing = programMap.get(programName);

      if (existing) {
        existing.points += tx.rewardPoints;
        existing.transactionCount++;
      } else {
        programMap.set(programName, {
          name: programName,
          points: tx.rewardPoints,
          transactionCount: 1,
          logoUrl: tx.paymentMethod?.rewardCurrencyLogoUrl,
          bgColor: tx.paymentMethod?.rewardCurrencyBgColor,
          logoScale: tx.paymentMethod?.rewardCurrencyLogoScale,
        });
      }
    });

    return Array.from(programMap.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, maxItems);
  }, [transactions, maxItems]);

  return (
    <Card className={`rounded-xl border border-border/50 bg-card ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Rewards by Program</CardTitle>
          <Link
            to="/loyalty"
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
        {topPrograms.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No rewards earned this period
          </p>
        ) : (
          <div className="space-y-1">
            {topPrograms.map((program) => (
              <Link
                key={program.name}
                to={`/loyalty?program=${encodeURIComponent(program.name)}`}
                className="w-full flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {program.logoUrl ? (
                    <div
                      className="h-8 w-8 min-w-[32px] flex items-center justify-center rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        backgroundColor: program.bgColor || "#ffffff",
                      }}
                    >
                      <img
                        src={program.logoUrl}
                        alt={program.name}
                        className="w-full h-full object-contain"
                        style={
                          program.logoScale
                            ? { transform: `scale(${program.logoScale})` }
                            : undefined
                        }
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 min-w-[32px] rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {getShortName(program.name)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {program.transactionCount}{" "}
                      {program.transactionCount === 1
                        ? "transaction"
                        : "transactions"}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p
                    className={`font-medium ${program.points >= 0 ? "text-primary" : "text-destructive"}`}
                  >
                    {program.points >= 0 ? "+" : ""}
                    {program.points.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">points</p>
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

export default React.memo(TopLoyaltyProgramsCard);
