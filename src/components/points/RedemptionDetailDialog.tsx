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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plane,
  Hotel,
  Gift,
  CreditCard,
  ArrowRight,
  Calendar,
  Hash,
  FileText,
  Users,
  MapPin,
  Edit2,
  Trash2,
  Loader2,
  CoinsIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type {
  PointsRedemption,
  PointsRedemptionInput,
  RedemptionType,
  CabinClass,
} from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";
import { RedemptionDialog } from "./RedemptionDialog";
import { CPPBadge } from "./BalanceCard";

const REDEMPTION_TYPE_CONFIG: Record<
  RedemptionType,
  { label: string; icon: React.ReactNode }
> = {
  flight: { label: "Flight Award", icon: <Plane className="h-5 w-5" /> },
  hotel: { label: "Hotel Reward", icon: <Hotel className="h-5 w-5" /> },
  merchandise: { label: "Merchandise", icon: <Gift className="h-5 w-5" /> },
  cash_back: { label: "Cash Back", icon: <CreditCard className="h-5 w-5" /> },
  statement_credit: {
    label: "Statement Credit",
    icon: <CreditCard className="h-5 w-5" />,
  },
  transfer_out: {
    label: "Transfer to Partner",
    icon: <ArrowRight className="h-5 w-5" />,
  },
  other: { label: "Other", icon: <CoinsIcon className="h-5 w-5" /> },
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

  if (!redemption) return null;

  const currencyName = redemption.rewardCurrency?.displayName ?? "Points";
  const typeConfig = REDEMPTION_TYPE_CONFIG[redemption.redemptionType];

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
          className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
          hideCloseButton
        >
          <DialogHeader showCloseButton>
            <DialogTitle className="flex items-center gap-2">
              {typeConfig.icon}
              {typeConfig.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Points Redeemed */}
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">
                -{redemption.pointsRedeemed.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{currencyName}</p>
              {redemption.cpp && (
                <div className="mt-2">
                  <CPPBadge cpp={redemption.cpp} />
                </div>
              )}
            </div>

            {/* Cash Value */}
            {redemption.cashValue && (
              <div className="text-center py-2 border rounded-lg">
                <p className="text-lg font-semibold">
                  {redemption.cashValueCurrency === "USD" && "$"}
                  {redemption.cashValueCurrency === "CAD" && "C$"}
                  {redemption.cashValueCurrency === "SGD" && "S$"}
                  {!["USD", "CAD", "SGD"].includes(
                    redemption.cashValueCurrency ?? ""
                  ) && `${redemption.cashValueCurrency} `}
                  {redemption.cashValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-muted-foreground">Cash Value</p>
              </div>
            )}

            {/* Details */}
            <div className="space-y-3">
              {/* Flight Route */}
              {redemption.flightRoute && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="font-medium">{redemption.flightRoute}</p>
                  </div>
                </div>
              )}

              {/* Cabin Class */}
              {redemption.cabinClass && (
                <div className="flex items-center gap-3">
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cabin</p>
                    <p className="font-medium">
                      {CABIN_CLASS_LABELS[redemption.cabinClass]}
                    </p>
                  </div>
                </div>
              )}

              {/* Airline */}
              {redemption.airline && (
                <div className="flex items-center gap-3">
                  <Plane className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Airline</p>
                    <p className="font-medium">{redemption.airline}</p>
                  </div>
                </div>
              )}

              {/* Passengers */}
              {redemption.passengers && redemption.passengers > 0 && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Passengers</p>
                    <p className="font-medium">{redemption.passengers}</p>
                  </div>
                </div>
              )}

              {/* Redemption Date */}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Redemption Date
                  </p>
                  <p className="font-medium">
                    {format(redemption.redemptionDate, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Travel Date */}
              {redemption.travelDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Travel Date</p>
                    <p className="font-medium">
                      {format(redemption.travelDate, "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}

              {/* Booking Reference */}
              {redemption.bookingReference && (
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-medium font-mono">
                      {redemption.bookingReference}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {redemption.description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{redemption.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleEdit}
                disabled={isLoading}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
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
