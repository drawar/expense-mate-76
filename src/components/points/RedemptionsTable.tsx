/**
 * RedemptionsTable - Table view for points redemptions
 */

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CoinsIcon,
  Plane,
  Hotel,
  Gift,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import type { PointsRedemption, RedemptionType } from "@/core/points/types";

// Loyalty program logos (reused from other components)
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
  "citi thankyou points (sg)":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  thankyou:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  "asia miles":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/cx-asiamiles.png",
  asiamiles:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/cx-asiamiles.png",
  "flying blue":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  flyingblue:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  "flying blue miles":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  aeroplan:
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/ac-aeroplan.png",
  "aeroplan points":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/ac-aeroplan.png",
};

function getLoyaltyProgramLogo(currency: string | undefined): string | null {
  if (!currency) return null;
  const normalizedCurrency = currency.toLowerCase();

  if (LOYALTY_PROGRAM_LOGOS[normalizedCurrency]) {
    return LOYALTY_PROGRAM_LOGOS[normalizedCurrency];
  }

  const withoutRegion = normalizedCurrency
    .replace(/\s*\([^)]+\)\s*$/, "")
    .trim();
  if (LOYALTY_PROGRAM_LOGOS[withoutRegion]) {
    return LOYALTY_PROGRAM_LOGOS[withoutRegion];
  }

  for (const [key, url] of Object.entries(LOYALTY_PROGRAM_LOGOS)) {
    if (normalizedCurrency.includes(key) || key.includes(withoutRegion)) {
      return url;
    }
  }

  return null;
}

const REDEMPTION_TYPE_CONFIG: Record<
  RedemptionType,
  { label: string; icon: React.ReactNode }
> = {
  flight: { label: "Flight", icon: <Plane className="h-4 w-4" /> },
  hotel: { label: "Hotel", icon: <Hotel className="h-4 w-4" /> },
  merchandise: { label: "Merchandise", icon: <Gift className="h-4 w-4" /> },
  cash_back: { label: "Cash Back", icon: <CreditCard className="h-4 w-4" /> },
  statement_credit: {
    label: "Statement Credit",
    icon: <CreditCard className="h-4 w-4" />,
  },
  transfer_out: { label: "Transfer", icon: <ArrowRight className="h-4 w-4" /> },
  other: { label: "Other", icon: <CoinsIcon className="h-4 w-4" /> },
};

/**
 * Get CPP rating color
 */
function getCppColor(cpp: number): string {
  if (cpp >= 2.0) return "text-green-600";
  if (cpp >= 1.5) return "text-emerald-600";
  if (cpp >= 1.0) return "text-yellow-600";
  return "text-red-600";
}

interface RedemptionsTableProps {
  redemptions: PointsRedemption[];
  onRowClick?: (redemption: PointsRedemption) => void;
  emptyMessage?: string;
}

export function RedemptionsTable({
  redemptions,
  onRowClick,
  emptyMessage = "No redemptions found.",
}: RedemptionsTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reward Currency</TableHead>
            <TableHead className="w-[140px]">Type</TableHead>
            <TableHead className="w-[120px]">Points</TableHead>
            <TableHead className="w-[100px]">CPP</TableHead>
            <TableHead className="w-[130px]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {redemptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            redemptions.map((redemption) => {
              const currencyName =
                redemption.rewardCurrency?.displayName ?? "Points";
              const logoUrl = getLoyaltyProgramLogo(currencyName);
              const typeConfig =
                REDEMPTION_TYPE_CONFIG[redemption.redemptionType];

              return (
                <TableRow
                  key={redemption.id}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(redemption)}
                >
                  {/* Reward Currency */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={currencyName}
                          className="h-8 w-8 rounded-full object-contain bg-white p-0.5"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <CoinsIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-medium block">
                          {currencyName}
                        </span>
                        {redemption.flightRoute && (
                          <span className="text-xs text-muted-foreground">
                            {redemption.flightRoute}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {typeConfig.icon}
                      <span>{typeConfig.label}</span>
                    </div>
                  </TableCell>

                  {/* Points Redeemed */}
                  <TableCell>
                    <span className="font-medium text-red-600">
                      -{redemption.pointsRedeemed.toLocaleString()}
                    </span>
                  </TableCell>

                  {/* CPP */}
                  <TableCell>
                    {redemption.cpp ? (
                      <Badge
                        variant="outline"
                        className={getCppColor(redemption.cpp)}
                      >
                        {redemption.cpp.toFixed(2)}cpp
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <span className="text-muted-foreground">
                      {format(redemption.redemptionDate, "MMM d, yyyy")}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default RedemptionsTable;
