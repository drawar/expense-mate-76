/**
 * TransferDialog - Form dialog for recording point transfers between programs
 * Visual ratio display design inspired by Qatar Airways Privilege Club
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
import { ChevronRight, ChevronDown, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import SelectionDialog, {
  SelectionOption,
} from "@/components/payment-method/SelectionDialog";
import type { PointsTransferInput } from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";

/**
 * Conversion rate data for filtering destination programs
 */
export interface ConversionRateData {
  sourceCurrencyId: string;
  targetCurrencyId: string;
  rate: number;
  sourceBlock: number | null;
  targetBlock: number | null;
  transferIncrement: number | null;
}

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
  conversionRates?: ConversionRateData[];
  defaultSourceCurrencyId?: string;
  isLoading?: boolean;
}

export function TransferDialog({
  isOpen,
  onClose,
  onSubmit,
  rewardCurrencies,
  conversionRates = [],
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

  // Filter destination options to only show programs that have conversion rates
  // from the selected source program
  const destOptions: SelectionOption[] = useMemo(() => {
    if (!sourceCurrencyId || conversionRates.length === 0) {
      // If no source selected or no rates, show all destinations
      return destinationCurrencies.map((c) => ({
        value: c.id,
        label: c.displayName,
        description: c.issuer || undefined,
      }));
    }

    // Get target currency IDs that have rates from the selected source
    const validTargetIds = new Set(
      conversionRates
        .filter((r) => r.sourceCurrencyId === sourceCurrencyId)
        .map((r) => r.targetCurrencyId)
    );

    // Filter and map destination currencies
    return destinationCurrencies
      .filter((c) => validTargetIds.has(c.id))
      .map((c) => ({
        value: c.id,
        label: c.displayName,
        description: c.issuer || undefined,
      }));
  }, [destinationCurrencies, sourceCurrencyId, conversionRates]);

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

  // Clear destination if it's no longer valid for the selected source
  useEffect(() => {
    if (
      sourceCurrencyId &&
      destinationCurrencyId &&
      conversionRates.length > 0
    ) {
      const isValid = conversionRates.some(
        (r) =>
          r.sourceCurrencyId === sourceCurrencyId &&
          r.targetCurrencyId === destinationCurrencyId
      );
      if (!isValid) {
        setDestinationCurrencyId("");
        setConversionRate("1");
      }
    }
  }, [sourceCurrencyId, conversionRates]);

  // Get the selected conversion rate with its transfer constraints
  const selectedRate = useMemo(() => {
    if (
      !sourceCurrencyId ||
      !destinationCurrencyId ||
      conversionRates.length === 0
    ) {
      return null;
    }
    return (
      conversionRates.find(
        (r) =>
          r.sourceCurrencyId === sourceCurrencyId &&
          r.targetCurrencyId === destinationCurrencyId
      ) || null
    );
  }, [sourceCurrencyId, destinationCurrencyId, conversionRates]);

  // Auto-fill conversion rate when source and destination are selected
  useEffect(() => {
    if (selectedRate) {
      setConversionRate(String(selectedRate.rate));
    }
  }, [selectedRate]);

  // Validate source amount against block and increment constraints
  const validationError = useMemo(() => {
    if (!sourceAmount || !selectedRate) return null;

    const amount = Number(sourceAmount);
    if (isNaN(amount) || amount <= 0) return null;

    const { sourceBlock, targetBlock, transferIncrement } = selectedRate;

    // Check minimum transfer (sourceBlock is the minimum)
    if (sourceBlock && amount < sourceBlock) {
      return `Minimum transfer is ${sourceBlock.toLocaleString()} points`;
    }

    // Check increment constraints
    if (sourceBlock && targetBlock) {
      if (transferIncrement) {
        // transferIncrement applies to TARGET miles (e.g., HSBC allows +2 miles increments)
        // Calculate source increment: sourceBlock * transferIncrement / targetBlock
        // e.g., HSBC: 50000 * 2 / 10000 = 10 points per 2 miles
        const sourceIncrement = (sourceBlock * transferIncrement) / targetBlock;
        const amountAfterMin = amount - sourceBlock;

        if (amountAfterMin > 0 && amountAfterMin % sourceIncrement !== 0) {
          return `Transfer must be ${sourceBlock.toLocaleString()} + multiples of ${sourceIncrement.toLocaleString()} points`;
        }
      } else {
        // No transferIncrement: transfers must be exact multiples of sourceBlock
        if (amount % sourceBlock !== 0) {
          return `Transfer must be in multiples of ${sourceBlock.toLocaleString()} points`;
        }
      }
    }

    return null;
  }, [sourceAmount, selectedRate]);

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
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {/* Visual Ratio Display */}
              <div className="flex items-stretch gap-3">
                {/* Source Box */}
                <div
                  className="flex-1 rounded-xl p-4 flex flex-col items-center"
                  style={{ backgroundColor: "var(--color-bg-tertiary)" }}
                >
                  {/* Source Amount - Editable only after both programs selected */}
                  <Input
                    id="sourceAmount"
                    type="text"
                    inputMode="numeric"
                    placeholder={
                      sourceCurrencyId && destinationCurrencyId ? "0" : "—"
                    }
                    value={
                      sourceAmount ? Number(sourceAmount).toLocaleString() : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setSourceAmount(raw);
                    }}
                    disabled={!sourceCurrencyId || !destinationCurrencyId}
                    className="h-10 w-full text-xl font-semibold text-center border-none shadow-none p-0 focus-visible:ring-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: "var(--color-text-primary)" }}
                  />
                  {/* Source Currency Selector */}
                  <button
                    type="button"
                    onClick={() => setShowSourceDialog(true)}
                    className="mt-1 flex items-center justify-center gap-1 text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <span className="text-center line-clamp-2">
                      {sourceCurrency?.displayName || "Select program"}
                    </span>
                    <ChevronDown
                      className="h-3 w-3 shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  </button>
                  {/* Source Currency Logo */}
                  {sourceCurrency?.logoUrl && (
                    <div className="mt-2 h-[60px] w-[60px] flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-white">
                      <img
                        src={sourceCurrency.logoUrl}
                        alt={sourceCurrency?.displayName}
                        className="h-[60px] w-[60px] object-contain"
                        style={{ transform: "scale(0.85)" }}
                      />
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex items-center">
                  <ArrowRight
                    className="h-5 w-5"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                </div>

                {/* Destination Box */}
                <div
                  className="flex-1 rounded-xl p-4 flex flex-col items-center"
                  style={{ backgroundColor: "var(--color-bg-tertiary)" }}
                >
                  {/* Destination Amount - Calculated (only show when valid source amount and no validation error) */}
                  <div
                    className={`h-10 flex items-center text-xl font-semibold text-center ${
                      !sourceAmount ||
                      Number(sourceAmount) <= 0 ||
                      validationError
                        ? "opacity-50"
                        : ""
                    }`}
                    style={{ color: "var(--color-accent)" }}
                  >
                    {sourceAmount &&
                    Number(sourceAmount) > 0 &&
                    destinationAmount &&
                    !validationError
                      ? Number(destinationAmount).toLocaleString()
                      : "—"}
                  </div>
                  {/* Destination Currency Selector */}
                  <button
                    type="button"
                    onClick={() => setShowDestDialog(true)}
                    className="mt-1 flex items-center justify-center gap-1 text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <span className="text-center line-clamp-2">
                      {destCurrency?.displayName || "Select program"}
                    </span>
                    <ChevronDown
                      className="h-3 w-3 shrink-0"
                      style={{ color: "var(--color-text-tertiary)" }}
                    />
                  </button>
                  {/* Destination Currency Logo */}
                  {destCurrency?.logoUrl && (
                    <div className="mt-2 h-[60px] w-[60px] flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 bg-white">
                      <img
                        src={destCurrency.logoUrl}
                        alt={destCurrency?.displayName}
                        className="h-[60px] w-[60px] object-contain"
                        style={{ transform: "scale(0.85)" }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Error */}
              {validationError && (
                <p
                  className="text-sm text-center"
                  style={{ color: "var(--color-error)" }}
                >
                  {validationError}
                </p>
              )}

              {/* Transfer Details Section */}
              <div className="space-y-1 pt-2">
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
                      setTransferBonusRate(
                        e.target.value.replace(/[^0-9]/g, "")
                      )
                    }
                    className="h-9 rounded-lg text-base md:text-sm text-right border-none shadow-none pl-0 pr-2 focus-visible:ring-0 w-20"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--color-text-primary)",
                    }}
                  />
                </div>

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
              </div>

              {/* Optional Fields Section */}
              <div className="pt-2">
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
                  Number(destinationAmount) <= 0 ||
                  !!validationError
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
        open={showSourceDialog}
        onOpenChange={(open) => setShowSourceDialog(open)}
        onCloseAll={onClose}
        title="Source Program"
        options={sourceOptions}
        selectedValue={sourceCurrencyId}
        onSelect={(value) => {
          setSourceCurrencyId(value);
          setShowSourceDialog(false);
        }}
      />

      <SelectionDialog
        open={showDestDialog}
        onOpenChange={(open) => setShowDestDialog(open)}
        onCloseAll={onClose}
        title="Destination Program"
        options={destOptions}
        selectedValue={destinationCurrencyId}
        onSelect={(value) => {
          setDestinationCurrencyId(value);
          setShowDestDialog(false);
        }}
      />

      <SelectionDialog
        open={showFeeCurrencyDialog}
        onOpenChange={(open) => setShowFeeCurrencyDialog(open)}
        onCloseAll={onClose}
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
