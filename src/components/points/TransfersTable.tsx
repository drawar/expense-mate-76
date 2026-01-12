/**
 * TransfersTable - Table view for points transfers
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
import { CoinsIcon, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { PointsTransfer } from "@/core/points/types";

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

interface TransfersTableProps {
  transfers: PointsTransfer[];
  onRowClick?: (transfer: PointsTransfer) => void;
  emptyMessage?: string;
}

export function TransfersTable({
  transfers,
  onRowClick,
  emptyMessage = "No transfers found.",
}: TransfersTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From</TableHead>
            <TableHead>To</TableHead>
            <TableHead className="w-[120px]">Points Out</TableHead>
            <TableHead className="w-[120px]">Points In</TableHead>
            <TableHead className="w-[100px]">Rate</TableHead>
            <TableHead className="w-[130px]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transfers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            transfers.map((transfer) => {
              const sourceName =
                transfer.sourceCurrency?.displayName ?? "Points";
              const destName =
                transfer.destinationCurrency?.displayName ?? "Points";
              const sourceLogo = getLoyaltyProgramLogo(sourceName);
              const destLogo = getLoyaltyProgramLogo(destName);

              return (
                <TableRow
                  key={transfer.id}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(transfer)}
                >
                  {/* Source Currency */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sourceLogo ? (
                        <img
                          src={sourceLogo}
                          alt={sourceName}
                          className="h-7 w-7 rounded-full object-contain bg-white p-0.5"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                          <CoinsIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-sm">{sourceName}</span>
                    </div>
                  </TableCell>

                  {/* Destination Currency */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {destLogo ? (
                        <img
                          src={destLogo}
                          alt={destName}
                          className="h-7 w-7 rounded-full object-contain bg-white p-0.5"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                          <CoinsIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-sm">{destName}</span>
                    </div>
                  </TableCell>

                  {/* Source Amount */}
                  <TableCell>
                    <span className="font-medium text-red-600">
                      -{transfer.sourceAmount.toLocaleString()}
                    </span>
                  </TableCell>

                  {/* Destination Amount */}
                  <TableCell>
                    <span className="font-medium text-green-600">
                      +{transfer.destinationAmount.toLocaleString()}
                    </span>
                  </TableCell>

                  {/* Rate */}
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">
                        {transfer.conversionRate}:1
                      </span>
                      {transfer.transferBonusRate &&
                        transfer.transferBonusRate > 0 && (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-300 bg-green-50 text-xs w-fit"
                          >
                            +{(transfer.transferBonusRate * 100).toFixed(0)}%
                          </Badge>
                        )}
                    </div>
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <span className="text-muted-foreground">
                      {format(transfer.transferDate, "MMM d, yyyy")}
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

export default TransfersTable;
