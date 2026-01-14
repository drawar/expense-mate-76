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
              const logoUrl = redemption.rewardCurrency?.logoUrl;
              const bgColor = redemption.rewardCurrency?.bgColor;
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
                          className="h-8 w-8 rounded-full object-contain p-0.5"
                          style={{ backgroundColor: bgColor || "#ffffff" }}
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
