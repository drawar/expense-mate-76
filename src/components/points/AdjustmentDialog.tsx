/**
 * AdjustmentDialog - Form dialog for adding/editing manual point adjustments
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import SelectionDialog, {
  SelectionOption,
} from "@/components/payment-method/SelectionDialog";
import type {
  PointsAdjustment,
  PointsAdjustmentInput,
  AdjustmentType,
} from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string }[] = [
  { value: "bonus", label: "Sign-up / Welcome Bonus" },
  { value: "promotional", label: "Promotional Bonus" },
  { value: "correction", label: "Correction" },
  { value: "expired", label: "Expired Points" },
  { value: "other", label: "Other" },
];

const ADJUSTMENT_TYPE_OPTIONS: SelectionOption[] = ADJUSTMENT_TYPES.map(
  (t) => ({
    value: t.value,
    label: t.label,
  })
);

const SIGN_OPTIONS: SelectionOption[] = [
  { value: "add", label: "Add (+)" },
  { value: "subtract", label: "Subtract (-)" },
];

interface AdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PointsAdjustmentInput) => Promise<void>;
  rewardCurrencies: RewardCurrency[];
  adjustment?: PointsAdjustment; // For editing
  defaultCurrencyId?: string;
  isLoading?: boolean;
}

export function AdjustmentDialog({
  isOpen,
  onClose,
  onSubmit,
  rewardCurrencies,
  adjustment,
  defaultCurrencyId,
  isLoading = false,
}: AdjustmentDialogProps) {
  const isEditing = !!adjustment;

  // Form state
  const [rewardCurrencyId, setRewardCurrencyId] = useState(
    defaultCurrencyId || ""
  );
  const [amount, setAmount] = useState("");
  const [isNegative, setIsNegative] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("bonus");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [adjustmentDate, setAdjustmentDate] = useState<Date>(new Date());

  // Selection dialog state
  const [showCurrencyDialog, setShowCurrencyDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset form when dialog opens/closes or adjustment changes
  useEffect(() => {
    if (isOpen) {
      if (adjustment) {
        setRewardCurrencyId(adjustment.rewardCurrencyId);
        setAmount(String(Math.abs(adjustment.amount)));
        setIsNegative(adjustment.amount < 0);
        setAdjustmentType(adjustment.adjustmentType);
        setDescription(adjustment.description);
        setReferenceNumber(adjustment.referenceNumber || "");
        setAdjustmentDate(adjustment.adjustmentDate);
      } else {
        setRewardCurrencyId(defaultCurrencyId || "");
        setAmount("");
        setIsNegative(false);
        setAdjustmentType("bonus");
        setDescription("");
        setReferenceNumber("");
        setAdjustmentDate(new Date());
      }
    }
  }, [isOpen, adjustment, defaultCurrencyId]);

  // Auto-set negative for expired type
  useEffect(() => {
    if (adjustmentType === "expired") {
      setIsNegative(true);
    }
  }, [adjustmentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = Number(amount);
    if (!rewardCurrencyId || isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    const finalAmount = isNegative ? -numAmount : numAmount;

    await onSubmit({
      rewardCurrencyId,
      amount: finalAmount,
      adjustmentType,
      description,
      referenceNumber: referenceNumber || undefined,
      adjustmentDate,
    });
  };

  const selectedCurrency = (rewardCurrencies || []).find(
    (c) => c.id === rewardCurrencyId
  );

  // Build currency options for selection dialog
  const currencyOptions: SelectionOption[] = (rewardCurrencies || []).map(
    (c) => ({
      value: c.id,
      label: c.displayName,
      description: c.issuer || undefined,
    })
  );

  const getTypeLabel = () => {
    return (
      ADJUSTMENT_TYPES.find((t) => t.value === adjustmentType)?.label || "Other"
    );
  };

  const getSignLabel = () => {
    return isNegative ? "Subtract (-)" : "Add (+)";
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
            <DialogTitle>
              {isEditing ? "Edit Adjustment" : "Add Points Adjustment"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
              {/* Reward Currency */}
              <button
                type="button"
                onClick={() => !isEditing && setShowCurrencyDialog(true)}
                className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                disabled={isEditing}
              >
                <span
                  className="font-medium whitespace-nowrap shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Reward Currency
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {selectedCurrency?.displayName || "Select currency"}
                  </span>
                  {!isEditing && (
                    <ChevronRight
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  )}
                </span>
              </button>

              {/* Adjustment Type */}
              <button
                type="button"
                onClick={() => setShowTypeDialog(true)}
                className="w-full py-3 flex items-center justify-between text-base md:text-sm"
              >
                <span
                  className="font-medium whitespace-nowrap shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Type
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {getTypeLabel()}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                </span>
              </button>

              {/* Points Amount - Sign selector */}
              <button
                type="button"
                onClick={() => setShowSignDialog(true)}
                className="w-full py-3 flex items-center justify-between text-base md:text-sm"
              >
                <span
                  className="font-medium whitespace-nowrap shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Operation
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {getSignLabel()}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                </span>
              </button>

              {/* Points Amount - Input */}
              <div className="py-3 flex items-center justify-between gap-4">
                <label
                  htmlFor="amount"
                  className="text-base md:text-sm font-medium shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Amount
                </label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="10000"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-32"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Amount Preview */}
              {selectedCurrency && amount && (
                <p
                  className="text-sm text-right pb-2"
                  style={{
                    color: isNegative
                      ? "var(--color-error)"
                      : "var(--color-accent)",
                  }}
                >
                  {isNegative ? "-" : "+"}
                  {Number(amount).toLocaleString()}{" "}
                  {selectedCurrency.displayName}
                </p>
              )}

              {/* Adjustment Date */}
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                  >
                    <span
                      className="font-medium whitespace-nowrap shrink-0"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Date
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {format(adjustmentDate, "yyyy-MM-dd")}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--color-text-tertiary)" }}
                      />
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="end"
                  side="top"
                  sideOffset={4}
                >
                  <Calendar
                    mode="single"
                    selected={adjustmentDate}
                    onSelect={(date) => {
                      if (date) {
                        setAdjustmentDate(date);
                        setShowDatePicker(false);
                      }
                    }}
                    defaultMonth={adjustmentDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Reference Number (optional) */}
              <div className="py-3 flex items-center justify-between gap-4">
                <label
                  htmlFor="reference"
                  className="text-base md:text-sm font-medium shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Reference
                </label>
                <Input
                  id="reference"
                  placeholder="Optional"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-40"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Description with Markdown support */}
              <div className="pt-4 space-y-2">
                <label
                  htmlFor="description"
                  className="text-base md:text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Notes
                </label>
                <Textarea
                  id="description"
                  placeholder="Supports Markdown (tables, bold, etc.)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="text-base md:text-sm"
                />
                {description && (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-p:my-1 prose-table:text-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {description}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-4 py-4 border-t flex gap-3 flex-shrink-0"
              style={{ borderColor: "var(--color-border)" }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  isLoading ||
                  !rewardCurrencyId ||
                  !amount ||
                  Number(amount) <= 0
                }
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Add Adjustment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Selection Dialogs */}
      <SelectionDialog
        open={showCurrencyDialog}
        onOpenChange={setShowCurrencyDialog}
        onCloseAll={onClose}
        title="Reward Currency"
        options={currencyOptions}
        selectedValue={rewardCurrencyId}
        onSelect={(value) => {
          setRewardCurrencyId(value);
        }}
      />

      <SelectionDialog
        open={showTypeDialog}
        onOpenChange={setShowTypeDialog}
        onCloseAll={onClose}
        title="Adjustment Type"
        options={ADJUSTMENT_TYPE_OPTIONS}
        selectedValue={adjustmentType}
        onSelect={(value) => {
          setAdjustmentType(value as AdjustmentType);
        }}
      />

      <SelectionDialog
        open={showSignDialog}
        onOpenChange={setShowSignDialog}
        onCloseAll={onClose}
        title="Operation"
        options={SIGN_OPTIONS}
        selectedValue={isNegative ? "subtract" : "add"}
        onSelect={(value) => {
          setIsNegative(value === "subtract");
        }}
      />
    </>
  );
}

export default AdjustmentDialog;
