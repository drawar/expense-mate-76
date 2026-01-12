/**
 * AdjustmentDialog - Form dialog for adding/editing manual point adjustments
 */

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Adjustment" : "Add Points Adjustment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reward Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Reward Currency</Label>
            <Select
              value={rewardCurrencyId}
              onValueChange={setRewardCurrencyId}
              disabled={isEditing}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {(rewardCurrencies || []).map((currency) => (
                  <SelectItem key={currency.id} value={currency.id}>
                    {currency.displayName}
                    {currency.issuer && (
                      <span className="text-muted-foreground ml-1">
                        ({currency.issuer})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Adjustment Type</Label>
            <Select
              value={adjustmentType}
              onValueChange={(v) => setAdjustmentType(v as AdjustmentType)}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Points Amount</Label>
            <div className="flex gap-2">
              <Select
                value={isNegative ? "subtract" : "add"}
                onValueChange={(v) => setIsNegative(v === "subtract")}
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add (+)</SelectItem>
                  <SelectItem value="subtract">Subtract (-)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="amount"
                type="number"
                min="0"
                step="1"
                placeholder="10000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
            </div>
            {selectedCurrency && amount && (
              <p className="text-sm text-muted-foreground">
                {isNegative ? "-" : "+"}
                {Number(amount).toLocaleString()} {selectedCurrency.displayName}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., Welcome bonus from signup, Rakuten cashback, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Reference Number (optional) */}
          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number (optional)</Label>
            <Input
              id="reference"
              placeholder="e.g., Confirmation code"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Adjustment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !adjustmentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {adjustmentDate ? (
                    format(adjustmentDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={adjustmentDate}
                  onSelect={(date) => date && setAdjustmentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading || !rewardCurrencyId || !amount || Number(amount) <= 0
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AdjustmentDialog;
