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
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Hash,
  FileText,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
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

  if (!adjustment) return null;

  const isPositive = adjustment.amount >= 0;
  const currencyName = adjustment.rewardCurrency?.displayName ?? "Points";

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
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              {ADJUSTMENT_TYPE_LABELS[adjustment.adjustmentType]}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Amount */}
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <p
                className={`text-3xl font-bold ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {adjustment.amount.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{currencyName}</p>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {/* Date */}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(adjustment.adjustmentDate, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              {/* Type */}
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {ADJUSTMENT_TYPE_LABELS[adjustment.adjustmentType]}
                  </p>
                </div>
              </div>

              {/* Reference Number */}
              {adjustment.referenceNumber && (
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-medium font-mono">
                      {adjustment.referenceNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Description */}
              {adjustment.description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-p:my-1 prose-table:text-sm">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {adjustment.description}
                      </ReactMarkdown>
                    </div>
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
