/**
 * RedemptionDetailDialog - View/Edit/Delete redemption details
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDownIcon, ChevronUpIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type {
  PointsRedemption,
  PointsRedemptionInput,
  RedemptionType,
  CabinClass,
} from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";
import { RedemptionDialog } from "./RedemptionDialog";
import { CPPBadge } from "./BalanceCard";

const REDEMPTION_TYPE_LABELS: Record<RedemptionType, string> = {
  flight: "Flight Award",
  hotel: "Hotel Reward",
  merchandise: "Merchandise",
  cash_back: "Cash Back",
  statement_credit: "Statement Credit",
  transfer_out: "Transfer to Partner",
  other: "Other",
};

const CABIN_CLASS_LABELS: Record<CabinClass, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First Class",
};

interface RedemptionDetailDialogProps {
  redemption: PointsRedemption | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    id: string,
    input: Partial<PointsRedemptionInput>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  rewardCurrencies: RewardCurrency[];
  isLoading?: boolean;
}

export function RedemptionDetailDialog({
  redemption,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  rewardCurrencies,
  isLoading = false,
}: RedemptionDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!redemption) return null;

  const currencyName = redemption.rewardCurrency?.displayName ?? "Points";
  const hasAdditionalDetails =
    redemption.flightRoute ||
    redemption.cabinClass ||
    redemption.airline ||
    (redemption.passengers && redemption.passengers > 0) ||
    redemption.travelDate ||
    redemption.bookingReference ||
    redemption.description;

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (input: PointsRedemptionInput) => {
    await onUpdate(redemption.id, input);
    setShowEditDialog(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(redemption.id);
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        open={isOpen && !showEditDialog}
        onOpenChange={(open) => !open && onClose()}
      >
        <DialogContent
          className="sm:max-w-lg max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden"
          hideCloseButton
        >
          <DialogHeader
            className="border-b flex-shrink-0"
            showCloseButton
            onClose={onClose}
          >
            <DialogTitle className="flex items-center justify-center gap-2">
              {currencyName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 min-h-0">
            {/* Amount (Hero) */}
            <div className="py-2 text-center">
              <p
                className="text-4xl font-semibold"
                style={{ color: "var(--color-error)" }}
              >
                -{redemption.pointsRedeemed.toLocaleString()}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{format(redemption.redemptionDate, "yyyy-MM-dd")}</span>
                <span>·</span>
                <span>{REDEMPTION_TYPE_LABELS[redemption.redemptionType]}</span>
              </div>
              {redemption.cpp && (
                <div className="mt-2">
                  <CPPBadge cpp={redemption.cpp} />
                </div>
              )}
            </div>

            {/* Cash Value */}
            {redemption.cashValue && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Cash Value
                </p>
                <p className="text-lg font-semibold">
                  {redemption.cashValueCurrency === "USD" && "$"}
                  {redemption.cashValueCurrency === "CAD" && "C$"}
                  {redemption.cashValueCurrency === "SGD" && "S$"}
                  {redemption.cashValueCurrency === "EUR" && "€"}
                  {!["USD", "CAD", "SGD", "EUR"].includes(
                    redemption.cashValueCurrency ?? ""
                  ) && `${redemption.cashValueCurrency} `}
                  {redemption.cashValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}

            {/* Additional Details (Collapsible) */}
            {hasAdditionalDetails && (
              <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                    <span className="text-xs font-medium uppercase tracking-wide">
                      Additional details
                    </span>
                    {isDetailsOpen ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {redemption.flightRoute && (
                      <div className="flex justify-between">
                        <span>Route</span>
                        <span className="text-foreground">
                          {redemption.flightRoute}
                        </span>
                      </div>
                    )}
                    {redemption.cabinClass && (
                      <div className="flex justify-between">
                        <span>Cabin</span>
                        <span className="text-foreground">
                          {CABIN_CLASS_LABELS[redemption.cabinClass]}
                        </span>
                      </div>
                    )}
                    {redemption.airline && (
                      <div className="flex justify-between">
                        <span>Airline</span>
                        <span className="text-foreground">
                          {redemption.airline}
                        </span>
                      </div>
                    )}
                    {redemption.passengers && redemption.passengers > 0 && (
                      <div className="flex justify-between">
                        <span>Passengers</span>
                        <span className="text-foreground">
                          {redemption.passengers}
                        </span>
                      </div>
                    )}
                    {redemption.travelDate && (
                      <div className="flex justify-between">
                        <span>Travel date</span>
                        <span className="text-foreground">
                          {format(redemption.travelDate, "yyyy-MM-dd")}
                        </span>
                      </div>
                    )}
                    {redemption.bookingReference && (
                      <div className="flex justify-between">
                        <span>Reference</span>
                        <span className="font-mono text-xs text-foreground">
                          {redemption.bookingReference}
                        </span>
                      </div>
                    )}
                    {redemption.description && (
                      <div className="pt-2 border-t">
                        <span className="block mb-1">Notes</span>
                        <p className="text-foreground">
                          {redemption.description}
                        </p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          {/* Action Buttons */}
          <div
            className="px-4 py-4 border-t flex gap-3 flex-shrink-0"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEdit}
              disabled={isLoading}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              className="flex-1 hover:bg-destructive hover:text-white hover:border-destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <RedemptionDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSubmit={handleEditSubmit}
        rewardCurrencies={rewardCurrencies}
        redemption={redemption}
        isLoading={isLoading}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Redemption?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this{" "}
              {redemption.pointsRedeemed.toLocaleString()} {currencyName}{" "}
              redemption. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default RedemptionDetailDialog;
