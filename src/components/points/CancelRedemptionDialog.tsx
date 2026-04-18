/**
 * CancelRedemptionDialog - Confirmation dialog for cancelling a redemption
 */

import React, { useState } from "react";
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
import { Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import SelectionDialog, {
  SelectionOption,
} from "@/components/payment-method/SelectionDialog";
import type { PointsRedemption, CabinClass } from "@/core/points/types";
import { CurrencyService } from "@/core/currency";

const CABIN_CLASS_LABELS: Record<CabinClass, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First Class",
};

const REDEMPTION_TYPE_LABELS: Record<string, string> = {
  flight: "Flight Award",
  hotel: "Hotel Reward",
  merchandise: "Merchandise",
  cash_back: "Cash Back",
  statement_credit: "Statement Credit",
  transfer_out: "Transfer to Partner",
  other: "Other",
};

export interface CancelRedemptionInput {
  originalRedemptionId: string;
  serviceFee?: number;
  serviceFeeCurrency?: string;
  cancellationDate?: Date;
  description?: string;
}

interface CancelRedemptionDialogProps {
  redemption: PointsRedemption | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CancelRedemptionInput) => Promise<void>;
  isLoading?: boolean;
}

export function CancelRedemptionDialog({
  redemption,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CancelRedemptionDialogProps) {
  const [cancellationDate, setCancellationDate] = useState<Date>(new Date());
  const [serviceFee, setServiceFee] = useState("");
  const [serviceFeeCurrency, setServiceFeeCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (isOpen && redemption) {
      setCancellationDate(new Date());
      setServiceFee("");
      setServiceFeeCurrency(redemption.cashValueCurrency ?? "USD");
      setNotes(`Cancellation of ${redemption.description}`);
    }
  }, [isOpen, redemption]);

  if (!redemption) return null;

  const currencyName = redemption.rewardCurrency?.displayName ?? "Points";

  const currencyOptions: SelectionOption[] =
    CurrencyService.getCurrencyOptions().map((c) => ({
      value: c.value,
      label: c.value,
    }));

  const handleSubmit = async () => {
    const fee = serviceFee ? parseFloat(serviceFee) : undefined;
    await onSubmit({
      originalRedemptionId: redemption.id,
      serviceFee: fee && fee > 0 ? fee : undefined,
      serviceFeeCurrency: fee && fee > 0 ? serviceFeeCurrency : undefined,
      cancellationDate,
      description: notes || undefined,
    });
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
              Cancel Redemption
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 min-h-0">
            {/* Original Redemption Summary */}
            <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Original Redemption
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency</span>
                  <span className="font-medium">{currencyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Points</span>
                  <span className="font-medium text-red-600">
                    -{redemption.pointsRedeemed.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>
                    {REDEMPTION_TYPE_LABELS[redemption.redemptionType] ??
                      redemption.redemptionType}
                  </span>
                </div>
                {redemption.flightRoute && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Route</span>
                    <span>{redemption.flightRoute}</span>
                  </div>
                )}
                {redemption.cabinClass && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cabin</span>
                    <span>{CABIN_CLASS_LABELS[redemption.cabinClass]}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>
                    {format(redemption.redemptionDate, "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* Points Being Restored */}
            <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950/20">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Points Restored
              </p>
              <p className="text-2xl font-semibold text-green-600">
                +{redemption.pointsRedeemed.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">{currencyName}</p>
            </div>

            {/* Cancellation Date */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Cancellation Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(cancellationDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={cancellationDate}
                    onSelect={(date) => date && setCancellationDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Service Fee */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Service / Cancellation Fee
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-20 shrink-0"
                  onClick={() => setShowCurrencyPicker(true)}
                >
                  {serviceFeeCurrency}
                </Button>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You'll be redirected to log this as an expense after confirming
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Notes</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this cancellation"
                rows={2}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="px-4 py-4 border-t flex gap-3 flex-shrink-0"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Redemption
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Currency Picker */}
      <SelectionDialog
        isOpen={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        onSelect={(value) => {
          setServiceFeeCurrency(value);
          setShowCurrencyPicker(false);
        }}
        options={currencyOptions}
        title="Select Currency"
        selectedValue={serviceFeeCurrency}
      />
    </>
  );
}

export default CancelRedemptionDialog;
