/**
 * AdjustmentsTable - Table view for points adjustments
 * Similar to TransactionTable pattern
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CoinsIcon } from "lucide-react";
import { format, isToday, startOfDay } from "date-fns";
import type { PointsAdjustment, AdjustmentType } from "@/core/points/types";

const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  starting_balance: "Starting Balance",
  bonus: "Sign-up Bonus",
  promotional: "Promotional",
  correction: "Correction",
  expired: "Expired",
  other: "Other",
};

interface AdjustmentsTableProps {
  adjustments: PointsAdjustment[];
  onRowClick?: (adjustment: PointsAdjustment) => void;
  emptyMessage?: string;
}

export function AdjustmentsTable({
  adjustments,
  onRowClick,
  emptyMessage = "No adjustments found.",
}: AdjustmentsTableProps) {
  const today = startOfDay(new Date());

  const getStatus = (adjustmentDate: Date): "pending" | "confirmed" => {
    const adjDate = startOfDay(adjustmentDate);
    return adjDate > today ? "pending" : "confirmed";
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reward Currency</TableHead>
            <TableHead className="w-[140px]">Type</TableHead>
            <TableHead className="w-[120px]">Amount</TableHead>
            <TableHead className="w-[130px]">Date</TableHead>
            <TableHead className="w-[50px] text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {adjustments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            adjustments.map((adjustment) => {
              const currencyName =
                adjustment.rewardCurrency?.displayName ?? "Points";
              const logoUrl = adjustment.rewardCurrency?.logoUrl;
              const bgColor = adjustment.rewardCurrency?.bgColor;
              const isPositive = adjustment.amount >= 0;
              const status = getStatus(adjustment.adjustmentDate);

              return (
                <TableRow
                  key={adjustment.id}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(adjustment)}
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
                      <span className="font-medium">{currencyName}</span>
                    </div>
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <span className="text-muted-foreground">
                      {ADJUSTMENT_TYPE_LABELS[adjustment.adjustmentType]}
                    </span>
                  </TableCell>

                  {/* Amount */}
                  <TableCell>
                    <span
                      className={`font-medium ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {adjustment.amount.toLocaleString()}
                    </span>
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <span className="text-muted-foreground">
                      {format(adjustment.adjustmentDate, "MMM d, yyyy")}
                    </span>
                  </TableCell>

                  {/* Status - Colored dot with tooltip */}
                  <TableCell>
                    <div className="flex justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center justify-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    status === "pending"
                                      ? "#C9A227" // Japandi ochre/amber
                                      : "#7D8E74", // Japandi sage green
                                }}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {status === "pending" ? "Pending" : "Confirmed"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
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

export default AdjustmentsTable;
