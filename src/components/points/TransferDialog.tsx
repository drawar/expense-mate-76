/**
 * TransferDialog - Form dialog for recording point transfers between programs
 */

import React, { useState, useEffect, useMemo } from "react";
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
import { ChevronRight, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import SelectionDialog, {
  SelectionOption,
} from "@/components/payment-method/SelectionDialog";
import type { PointsTransferInput } from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";

const FEE_CURRENCY_OPTIONS: SelectionOption[] = [
  { value: "USD", label: "USD" },
  { value: "SGD", label: "SGD" },
  { value: "CAD", label: "CAD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
];

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PointsTransferInput) => Promise<void>;
  rewardCurrencies: RewardCurrency[];
  defaultSourceCurrencyId?: string;
  isLoading?: boolean;
}

export function TransferDialog({
  isOpen,
  onClose,
  onSubmit,
  rewardCurrencies,
  defaultSourceCurrencyId,
  isLoading = false,
}: TransferDialogProps) {
  // Form state
  const [sourceCurrencyId, setSourceCurrencyId] = useState(
    defaultSourceCurrencyId || ""
  );
  const [sourceAmount, setSourceAmount] = useState("");
  const [destinationCurrencyId, setDestinationCurrencyId] = useState("");
  const [destinationAmount, setDestinationAmount] = useState("");
  const [conversionRate, setConversionRate] = useState("1");
  const [transferBonusRate, setTransferBonusRate] = useState("");
  const [transferFee, setTransferFee] = useState("");
  const [transferFeeCurrency, setTransferFeeCurrency] = useState("USD");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [transferDate, setTransferDate] = useState<Date>(new Date());

  // Selection dialog state
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [showDestDialog, setShowDestDialog] = useState(false);
  const [showFeeCurrencyDialog, setShowFeeCurrencyDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Separate currencies by transferability
  const transferableCurrencies = useMemo(
    () => (rewardCurrencies || []).filter((c) => c.isTransferrable),
    [rewardCurrencies]
  );
  const destinationCurrencies = useMemo(
    () => (rewardCurrencies || []).filter((c) => !c.isTransferrable),
    [rewardCurrencies]
  );

  // Build options for selection dialogs
  const sourceOptions: SelectionOption[] = transferableCurrencies.map((c) => ({
    value: c.id,
    label: c.displayName,
    description: c.issuer || undefined,
  }));

  const destOptions: SelectionOption[] = destinationCurrencies.map((c) => ({
    value: c.id,
    label: c.displayName,
    description: c.issuer || undefined,
  }));

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSourceCurrencyId(defaultSourceCurrencyId || "");
      setSourceAmount("");
      setDestinationCurrencyId("");
      setDestinationAmount("");
      setConversionRate("1");
      setTransferBonusRate("");
      setTransferFee("");
      setTransferFeeCurrency("USD");
      setReferenceNumber("");
      setNotes("");
      setTransferDate(new Date());
    }
  }, [isOpen, defaultSourceCurrencyId]);

  // Auto-calculate destination amount when source or rate changes
  useEffect(() => {
    const source = Number(sourceAmount);
    const rate = Number(conversionRate);
    const bonus = Number(transferBonusRate) || 0;

    if (source > 0 && rate > 0) {
      // Apply bonus rate if present (e.g., 25% bonus = 1.25x)
      const effectiveRate = rate * (1 + bonus / 100);
      const dest = Math.floor(source * effectiveRate);
      setDestinationAmount(String(dest));
    }
  }, [sourceAmount, conversionRate, transferBonusRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numSourceAmount = Number(sourceAmount);
    const numDestinationAmount = Number(destinationAmount);
    const numConversionRate = Number(conversionRate);

    if (
      !sourceCurrencyId ||
      !destinationCurrencyId ||
      isNaN(numSourceAmount) ||
      numSourceAmount <= 0 ||
      isNaN(numDestinationAmount) ||
      numDestinationAmount <= 0
    ) {
      return;
    }

    await onSubmit({
      sourceCurrencyId,
      sourceAmount: numSourceAmount,
      destinationCurrencyId,
      destinationAmount: numDestinationAmount,
      conversionRate: numConversionRate,
      transferBonusRate: transferBonusRate
        ? Number(transferBonusRate)
        : undefined,
      transferFee: transferFee ? Number(transferFee) : undefined,
      transferFeeCurrency: transferFee ? transferFeeCurrency : undefined,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
      transferDate,
    });
  };

  const sourceCurrency = (rewardCurrencies || []).find(
    (c) => c.id === sourceCurrencyId
  );
  const destCurrency = (rewardCurrencies || []).find(
    (c) => c.id === destinationCurrencyId
  );

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
            <DialogTitle>Record Points Transfer</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 min-h-0">
              {/* FROM Section */}
              <p
                className="text-xs font-medium uppercase tracking-wide pb-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                From
              </p>

              {/* Source Currency */}
              <button
                type="button"
                onClick={() => setShowSourceDialog(true)}
                className="w-full py-3 flex items-center justify-between text-base md:text-sm"
              >
                <span
                  className="font-medium whitespace-nowrap shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Source Program
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {sourceCurrency?.displayName || "Select program"}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                </span>
              </button>

              {/* Source Amount */}
              <div className="py-3 flex items-center justify-between gap-4">
                <label
                  htmlFor="sourceAmount"
                  className="text-base md:text-sm font-medium shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Points
                </label>
                <Input
                  id="sourceAmount"
                  type="text"
                  inputMode="numeric"
                  placeholder="50000"
                  value={sourceAmount}
                  onChange={(e) =>
                    setSourceAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-32"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Source Preview */}
              {sourceCurrency && sourceAmount && (
                <p
                  className="text-sm text-right pb-2"
                  style={{ color: "var(--color-error)" }}
                >
                  -{Number(sourceAmount).toLocaleString()}{" "}
                  {sourceCurrency.displayName}
                </p>
              )}

              {/* Transfer Arrow */}
              <div className="flex items-center justify-center py-3">
                <ArrowRight
                  className="h-5 w-5"
                  style={{ color: "var(--color-text-tertiary)" }}
                />
              </div>

              {/* TO Section */}
              <p
                className="text-xs font-medium uppercase tracking-wide pb-1"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                To
              </p>

              {/* Destination Currency */}
              <button
                type="button"
                onClick={() => setShowDestDialog(true)}
                className="w-full py-3 flex items-center justify-between text-base md:text-sm"
              >
                <span
                  className="font-medium whitespace-nowrap shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Destination Program
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {destCurrency?.displayName || "Select program"}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                </span>
              </button>

              {/* Conversion Rate */}
              <div className="py-3 flex items-center justify-between gap-4">
                <label
                  htmlFor="rate"
                  className="text-base md:text-sm font-medium shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Rate
                </label>
                <div className="flex items-center gap-1">
                  <span
                    className="text-sm"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    1:
                  </span>
                  <Input
                    id="rate"
                    type="text"
                    inputMode="decimal"
                    placeholder="1"
                    value={conversionRate}
                    onChange={(e) => setConversionRate(e.target.value)}
                    className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-16"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>
              </div>

              {/* Transfer Bonus */}
              <div className="py-3 flex items-center justify-between gap-4">
                <label
                  htmlFor="bonus"
                  className="text-base md:text-sm font-medium shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Bonus %
                </label>
                <Input
                  id="bonus"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={transferBonusRate}
                  onChange={(e) =>
                    setTransferBonusRate(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-20"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Destination Amount */}
              <div className="py-3 flex items-center justify-between gap-4">
                <label
                  htmlFor="destAmount"
                  className="text-base md:text-sm font-medium shrink-0"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Points Received
                </label>
                <Input
                  id="destAmount"
                  type="text"
                  inputMode="numeric"
                  placeholder="50000"
                  value={destinationAmount}
                  onChange={(e) =>
                    setDestinationAmount(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-32"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>

              {/* Destination Preview */}
              {destCurrency && destinationAmount && (
                <p
                  className="text-sm text-right pb-2"
                  style={{ color: "var(--color-accent)" }}
                >
                  +{Number(destinationAmount).toLocaleString()}{" "}
                  {destCurrency.displayName}
                </p>
              )}

              {/* Transfer Date */}
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
                        {format(transferDate, "yyyy-MM-dd")}
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0"
                        style={{ color: "var(--color-text-tertiary)" }}
                      />
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={transferDate}
                    onSelect={(date) => {
                      if (date) {
                        setTransferDate(date);
                        setShowDatePicker(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Optional Fields Section */}
              <div className="pt-4">
                <p
                  className="text-xs font-medium uppercase tracking-wide pb-2"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  Optional
                </p>

                {/* Transfer Fee Currency */}
                <button
                  type="button"
                  onClick={() => setShowFeeCurrencyDialog(true)}
                  className="w-full py-3 flex items-center justify-between text-base md:text-sm"
                >
                  <span
                    className="font-medium whitespace-nowrap shrink-0"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Fee Currency
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {transferFeeCurrency}
                    </span>
                    <ChevronRight
                      className="h-4 w-4 shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  </span>
                </button>

                {/* Transfer Fee */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <label
                    htmlFor="fee"
                    className="text-base md:text-sm font-medium shrink-0"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Fee Amount
                  </label>
                  <Input
                    id="fee"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={transferFee}
                    onChange={(e) => setTransferFee(e.target.value)}
                    className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-24"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

                {/* Reference Number */}
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
                    className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-32"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

                {/* Notes */}
                <div className="pt-2 space-y-2">
                  <label
                    htmlFor="notes"
                    className="text-base md:text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Notes
                  </label>
                  <Textarea
                    id="notes"
                    placeholder="e.g., 25% bonus promotion Q1 2025"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="text-base md:text-sm"
                  />
                </div>
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
                  !sourceCurrencyId ||
                  !destinationCurrencyId ||
                  !sourceAmount ||
                  Number(sourceAmount) <= 0 ||
                  !destinationAmount ||
                  Number(destinationAmount) <= 0
                }
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Transfer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Selection Dialogs */}
      <SelectionDialog
        isOpen={showSourceDialog}
        onClose={() => setShowSourceDialog(false)}
        title="Source Program"
        options={sourceOptions}
        selectedValue={sourceCurrencyId}
        onSelect={(value) => {
          setSourceCurrencyId(value);
          setShowSourceDialog(false);
        }}
      />

      <SelectionDialog
        isOpen={showDestDialog}
        onClose={() => setShowDestDialog(false)}
        title="Destination Program"
        options={destOptions}
        selectedValue={destinationCurrencyId}
        onSelect={(value) => {
          setDestinationCurrencyId(value);
          setShowDestDialog(false);
        }}
      />

      <SelectionDialog
        isOpen={showFeeCurrencyDialog}
        onClose={() => setShowFeeCurrencyDialog(false)}
        title="Fee Currency"
        options={FEE_CURRENCY_OPTIONS}
        selectedValue={transferFeeCurrency}
        onSelect={(value) => {
          setTransferFeeCurrency(value);
          setShowFeeCurrencyDialog(false);
        }}
      />
    </>
  );
}

export default TransferDialog;
