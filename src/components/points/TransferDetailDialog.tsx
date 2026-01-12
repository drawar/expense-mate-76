/**
 * TransferDetailDialog - View/Delete transfer details
 * Note: Transfers cannot be edited, only deleted
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
  ArrowRight,
  Calendar,
  Hash,
  FileText,
  Trash2,
  Loader2,
  CoinsIcon,
  Percent,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { PointsTransfer } from "@/core/points/types";

// Loyalty program logos
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
  "citi thankyou":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/citi-thankyou.png",
  "asia miles":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/cx-asiamiles.png",
  "flying blue":
    "https://yulueezoyjxobhureuxj.supabase.co/storage/v1/object/public/loyalty-programs/afklm-flyingblue.png",
  aeroplan:
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

interface TransferDetailDialogProps {
  transfer: PointsTransfer | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function TransferDetailDialog({
  transfer,
  isOpen,
  onClose,
  onDelete,
  isLoading = false,
}: TransferDetailDialogProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!transfer) return null;

  const sourceName = transfer.sourceCurrency?.displayName ?? "Points";
  const destName = transfer.destinationCurrency?.displayName ?? "Points";
  const sourceLogo = getLoyaltyProgramLogo(sourceName);
  const destLogo = getLoyaltyProgramLogo(destName);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(transfer.id);
      setShowDeleteConfirm(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Points Transfer
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Transfer Visual */}
            <div className="flex items-center justify-center gap-4 py-4 bg-muted/50 rounded-lg">
              {/* Source */}
              <div className="text-center">
                {sourceLogo ? (
                  <img
                    src={sourceLogo}
                    alt={sourceName}
                    className="h-12 w-12 rounded-full object-contain bg-white p-1 mx-auto"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mx-auto">
                    <CoinsIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm font-medium mt-2">{sourceName}</p>
                <p className="text-lg font-bold text-red-600">
                  -{transfer.sourceAmount.toLocaleString()}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight className="h-6 w-6 text-muted-foreground" />

              {/* Destination */}
              <div className="text-center">
                {destLogo ? (
                  <img
                    src={destLogo}
                    alt={destName}
                    className="h-12 w-12 rounded-full object-contain bg-white p-1 mx-auto"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mx-auto">
                    <CoinsIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <p className="text-sm font-medium mt-2">{destName}</p>
                <p className="text-lg font-bold text-green-600">
                  +{transfer.destinationAmount.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {/* Conversion Rate */}
              <div className="flex items-center gap-3">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Conversion Rate
                  </p>
                  <p className="font-medium">{transfer.conversionRate}:1</p>
                </div>
              </div>

              {/* Transfer Bonus */}
              {transfer.transferBonusRate && transfer.transferBonusRate > 0 && (
                <div className="flex items-center gap-3">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transfer Bonus
                    </p>
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-300 bg-green-50"
                    >
                      +{(transfer.transferBonusRate * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              )}

              {/* Transfer Fee */}
              {transfer.transferFee > 0 && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transfer Fee
                    </p>
                    <p className="font-medium text-red-600">
                      {transfer.transferFeeCurrency === "USD" && "$"}
                      {transfer.transferFeeCurrency === "CAD" && "C$"}
                      {transfer.transferFeeCurrency === "SGD" && "S$"}
                      {!["USD", "CAD", "SGD"].includes(
                        transfer.transferFeeCurrency ?? ""
                      ) && `${transfer.transferFeeCurrency ?? ""} `}
                      {transfer.transferFee.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Transfer Date */}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Transfer Date</p>
                  <p className="font-medium">
                    {format(transfer.transferDate, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Reference Number */}
              {transfer.referenceNumber && (
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-medium font-mono">
                      {transfer.referenceNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {transfer.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{transfer.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Close
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

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this transfer of{" "}
              {transfer.sourceAmount.toLocaleString()} {sourceName} to{" "}
              {transfer.destinationAmount.toLocaleString()} {destName}. This
              action cannot be undone.
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

export default TransferDetailDialog;
