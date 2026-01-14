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
import {
  ArrowRight,
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2,
  CoinsIcon,
} from "lucide-react";
import { format } from "date-fns";
import type { PointsTransfer } from "@/core/points/types";

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!transfer) return null;

  const sourceName = transfer.sourceCurrency?.displayName ?? "Points";
  const destName = transfer.destinationCurrency?.displayName ?? "Points";
  const sourceLogo = transfer.sourceCurrency?.logoUrl;
  const destLogo = transfer.destinationCurrency?.logoUrl;
  const hasAdditionalDetails =
    transfer.transferBonusRate ||
    transfer.transferFee > 0 ||
    transfer.referenceNumber ||
    transfer.notes;

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
              Points Transfer
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 min-h-0">
            {/* Transfer Visual (Hero) */}
            <div className="py-2">
              <div className="flex items-center justify-center gap-4">
                {/* Source */}
                <div className="text-center">
                  {sourceLogo ? (
                    <img
                      src={sourceLogo}
                      alt={sourceName}
                      className="h-12 w-12 rounded-full object-contain bg-white p-1 mx-auto"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <CoinsIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 max-w-[100px] truncate">
                    {sourceName}
                  </p>
                  <p
                    className="text-xl font-semibold"
                    style={{ color: "var(--color-error)" }}
                  >
                    -{transfer.sourceAmount.toLocaleString()}
                  </p>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                {/* Destination */}
                <div className="text-center">
                  {destLogo ? (
                    <img
                      src={destLogo}
                      alt={destName}
                      className="h-12 w-12 rounded-full object-contain bg-white p-1 mx-auto"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <CoinsIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 max-w-[100px] truncate">
                    {destName}
                  </p>
                  <p
                    className="text-xl font-semibold"
                    style={{ color: "var(--color-accent)" }}
                  >
                    +{transfer.destinationAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-3">
                <span>{format(transfer.transferDate, "yyyy-MM-dd")}</span>
                <span>·</span>
                <span>{transfer.conversionRate}:1 rate</span>
              </div>
            </div>

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
                    {transfer.transferBonusRate &&
                      transfer.transferBonusRate > 0 && (
                        <div className="flex justify-between">
                          <span>Transfer bonus</span>
                          <span
                            className="font-medium"
                            style={{ color: "var(--color-accent)" }}
                          >
                            +{(transfer.transferBonusRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    {transfer.transferFee > 0 && (
                      <div className="flex justify-between">
                        <span>Transfer fee</span>
                        <span className="text-foreground">
                          {transfer.transferFeeCurrency === "USD" && "$"}
                          {transfer.transferFeeCurrency === "CAD" && "C$"}
                          {transfer.transferFeeCurrency === "SGD" && "S$"}
                          {transfer.transferFeeCurrency === "EUR" && "€"}
                          {!["USD", "CAD", "SGD", "EUR"].includes(
                            transfer.transferFeeCurrency ?? ""
                          ) && `${transfer.transferFeeCurrency ?? ""} `}
                          {transfer.transferFee.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {transfer.referenceNumber && (
                      <div className="flex justify-between">
                        <span>Reference</span>
                        <span className="font-mono text-xs text-foreground">
                          {transfer.referenceNumber}
                        </span>
                      </div>
                    )}
                    {transfer.notes && (
                      <div className="pt-2 border-t">
                        <span className="block mb-1">Notes</span>
                        <p className="text-foreground">{transfer.notes}</p>
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
              className="flex-1 hover:bg-destructive hover:text-white hover:border-destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isLoading}
            >
              Delete
            </Button>
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
