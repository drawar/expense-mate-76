/**
 * TransferDialog - Form dialog for recording point transfers between programs
 */

import React, { useState, useEffect, useMemo } from "react";
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
import { CalendarIcon, Loader2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { PointsTransfer, PointsTransferInput } from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";

interface TransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PointsTransferInput) => Promise<void>;
  rewardCurrencies: RewardCurrency[];
  transfer?: PointsTransfer; // For editing
  defaultSourceCurrencyId?: string;
  isLoading?: boolean;
}

export function TransferDialog({
  isOpen,
  onClose,
  onSubmit,
  rewardCurrencies,
  transfer,
  defaultSourceCurrencyId,
  isLoading = false,
}: TransferDialogProps) {
  const isEditing = !!transfer;

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

  // Separate currencies by transferability
  const transferableCurrencies = useMemo(
    () => rewardCurrencies.filter((c) => c.isTransferrable),
    [rewardCurrencies]
  );
  const destinationCurrencies = useMemo(
    () => rewardCurrencies.filter((c) => !c.isTransferrable),
    [rewardCurrencies]
  );

  // Reset form when dialog opens/closes or transfer changes
  useEffect(() => {
    if (isOpen) {
      if (transfer) {
        setSourceCurrencyId(transfer.sourceCurrencyId);
        setSourceAmount(String(transfer.sourceAmount));
        setDestinationCurrencyId(transfer.destinationCurrencyId);
        setDestinationAmount(String(transfer.destinationAmount));
        setConversionRate(String(transfer.conversionRate));
        setTransferBonusRate(
          transfer.transferBonusRate ? String(transfer.transferBonusRate) : ""
        );
        setTransferFee(
          transfer.transferFee ? String(transfer.transferFee) : ""
        );
        setTransferFeeCurrency(transfer.transferFeeCurrency || "USD");
        setReferenceNumber(transfer.referenceNumber || "");
        setNotes(transfer.notes || "");
        setTransferDate(transfer.transferDate);
      } else {
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
    }
  }, [isOpen, transfer, defaultSourceCurrencyId]);

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

  const sourceCurrency = rewardCurrencies.find(
    (c) => c.id === sourceCurrencyId
  );
  const destCurrency = rewardCurrencies.find(
    (c) => c.id === destinationCurrencyId
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Transfer" : "Record Points Transfer"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Currency */}
          <div className="space-y-2">
            <Label htmlFor="sourceCurrency">From (Source Program)</Label>
            <Select
              value={sourceCurrencyId}
              onValueChange={setSourceCurrencyId}
              disabled={isEditing}
            >
              <SelectTrigger id="sourceCurrency">
                <SelectValue placeholder="Select source program" />
              </SelectTrigger>
              <SelectContent>
                {transferableCurrencies.map((currency) => (
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

          {/* Source Amount */}
          <div className="space-y-2">
            <Label htmlFor="sourceAmount">Points to Transfer</Label>
            <Input
              id="sourceAmount"
              type="number"
              min="0"
              step="1"
              placeholder="50000"
              value={sourceAmount}
              onChange={(e) => setSourceAmount(e.target.value)}
            />
            {sourceCurrency && sourceAmount && (
              <p className="text-sm text-muted-foreground">
                {Number(sourceAmount).toLocaleString()}{" "}
                {sourceCurrency.displayName}
              </p>
            )}
          </div>

          {/* Transfer Arrow Visual */}
          <div className="flex items-center justify-center py-2">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Destination Currency */}
          <div className="space-y-2">
            <Label htmlFor="destCurrency">To (Destination Program)</Label>
            <Select
              value={destinationCurrencyId}
              onValueChange={setDestinationCurrencyId}
              disabled={isEditing}
            >
              <SelectTrigger id="destCurrency">
                <SelectValue placeholder="Select destination program" />
              </SelectTrigger>
              <SelectContent>
                {destinationCurrencies.map((currency) => (
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

          {/* Conversion Rate & Bonus */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rate">Conversion Rate</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                placeholder="1.0"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                1:{conversionRate || "1"} ratio
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus">Transfer Bonus %</Label>
              <Input
                id="bonus"
                type="number"
                min="0"
                step="1"
                placeholder="25"
                value={transferBonusRate}
                onChange={(e) => setTransferBonusRate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional promo bonus
              </p>
            </div>
          </div>

          {/* Destination Amount (calculated) */}
          <div className="space-y-2">
            <Label htmlFor="destAmount">Points Received</Label>
            <Input
              id="destAmount"
              type="number"
              min="0"
              step="1"
              value={destinationAmount}
              onChange={(e) => setDestinationAmount(e.target.value)}
            />
            {destCurrency && destinationAmount && (
              <p className="text-sm text-muted-foreground">
                {Number(destinationAmount).toLocaleString()}{" "}
                {destCurrency.displayName}
              </p>
            )}
          </div>

          {/* Transfer Fee (optional) */}
          <div className="space-y-2">
            <Label htmlFor="fee">Transfer Fee (optional)</Label>
            <div className="flex gap-2">
              <Select
                value={transferFeeCurrency}
                onValueChange={setTransferFeeCurrency}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="SGD">SGD</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
              <Input
                id="fee"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={transferFee}
                onChange={(e) => setTransferFee(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          {/* Reference Number (optional) */}
          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number (optional)</Label>
            <Input
              id="reference"
              placeholder="e.g., Confirmation number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., 25% bonus promotion Q1 2025"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Transfer Date */}
          <div className="space-y-2">
            <Label>Transfer Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !transferDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {transferDate ? (
                    format(transferDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={transferDate}
                  onSelect={(date) => date && setTransferDate(date)}
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
              {isEditing ? "Save Changes" : "Record Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TransferDialog;
