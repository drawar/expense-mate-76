/**
 * AdjustmentDetailDialog - View/Edit/Delete adjustment details
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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type {
  PointsAdjustment,
  PointsAdjustmentInput,
  AdjustmentType,
} from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";
import { AdjustmentDialog } from "./AdjustmentDialog";

const ADJUSTMENT_TYPE_LABELS: Record<AdjustmentType, string> = {
  starting_balance: "Starting Balance",
  bonus: "Sign-up / Welcome Bonus",
  promotional: "Promotional Bonus",
  correction: "Correction",
  expired: "Expired Points",
  other: "Other",
};

interface AdjustmentDetailDialogProps {
  adjustment: PointsAdjustment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    id: string,
    input: Partial<PointsAdjustmentInput>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  rewardCurrencies: RewardCurrency[];
  isLoading?: boolean;
}

export function AdjustmentDetailDialog({
  adjustment,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  rewardCurrencies,
  isLoading = false,
}: AdjustmentDetailDialogProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (!adjustment) return null;

  const isPositive = adjustment.amount >= 0;
  const currencyName = adjustment.rewardCurrency?.displayName ?? "Points";
  const hasAdditionalDetails =
    adjustment.referenceNumber || adjustment.description;

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (input: PointsAdjustmentInput) => {
    await onUpdate(adjustment.id, input);
    setShowEditDialog(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(adjustment.id);
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
                style={{
                  color: isPositive
                    ? "var(--color-accent)"
                    : "var(--color-error)",
                }}
              >
                {isPositive ? "+" : ""}
                {adjustment.amount.toLocaleString()}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
                <span>{format(adjustment.adjustmentDate, "yyyy-MM-dd")}</span>
                <span>·</span>
                <span>{ADJUSTMENT_TYPE_LABELS[adjustment.adjustmentType]}</span>
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
                    {adjustment.referenceNumber && (
                      <div className="flex justify-between">
                        <span>Reference</span>
                        <span className="font-mono text-xs">
                          {adjustment.referenceNumber}
                        </span>
                      </div>
                    )}
                    {adjustment.description && (
                      <div className="pt-2 border-t">
                        <span className="block mb-1">Notes</span>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-p:my-1 prose-table:text-sm">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                          >
                            {adjustment.description}
                          </ReactMarkdown>
                        </div>
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
      <AdjustmentDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onSubmit={handleEditSubmit}
        rewardCurrencies={rewardCurrencies}
        adjustment={adjustment}
        isLoading={isLoading}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Adjustment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {isPositive ? "+" : ""}
              {adjustment.amount.toLocaleString()} {currencyName} adjustment.
              This action cannot be undone.
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

export default AdjustmentDetailDialog;
