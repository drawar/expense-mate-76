/**
 * StartingBalanceDialog - Form dialog for setting starting balance for a currency
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
import { Loader2, CoinsIcon, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { PointsBalance, PointsBalanceInput } from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";

interface StartingBalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PointsBalanceInput) => Promise<void>;
  rewardCurrencies: RewardCurrency[];
  existingBalance?: PointsBalance; // For editing
  defaultCurrencyId?: string;
  isLoading?: boolean;
}

export function StartingBalanceDialog({
  isOpen,
  onClose,
  onSubmit,
  rewardCurrencies,
  existingBalance,
  defaultCurrencyId,
  isLoading = false,
}: StartingBalanceDialogProps) {
  const isEditing = !!existingBalance;

  // Form state
  const [rewardCurrencyId, setRewardCurrencyId] = useState(
    defaultCurrencyId || ""
  );
  const [startingBalance, setStartingBalance] = useState("");
  const [balanceDate, setBalanceDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens/closes or balance changes
  useEffect(() => {
    if (isOpen) {
      if (existingBalance) {
        setRewardCurrencyId(existingBalance.rewardCurrencyId);
        setStartingBalance(String(existingBalance.startingBalance));
        setBalanceDate(existingBalance.balanceDate || new Date());
        setNotes(existingBalance.notes || "");
      } else {
        setRewardCurrencyId(defaultCurrencyId || "");
        setStartingBalance("");
        setBalanceDate(new Date());
        setNotes("");
      }
    }
  }, [isOpen, existingBalance, defaultCurrencyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numStartingBalance = Number(startingBalance);
    if (
      !rewardCurrencyId ||
      isNaN(numStartingBalance) ||
      numStartingBalance < 0
    ) {
      return;
    }

    await onSubmit({
      rewardCurrencyId,
      startingBalance: numStartingBalance,
      balanceDate,
      notes: notes.trim() || undefined,
    });
  };

  const selectedCurrency = (rewardCurrencies || []).find(
    (c) => c.id === rewardCurrencyId
  );

  return (
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
            {isEditing ? "Edit Starting Balance" : "Set Starting Balance"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            <p className="text-sm text-muted-foreground">
              Enter your current points balance. The system will track all
              future earning and spending from this baseline.
            </p>

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

            {/* Starting Balance */}
            <div className="space-y-2">
              <Label htmlFor="balance">Starting Balance</Label>
              <div className="relative">
                <CoinsIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="balance"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedCurrency && startingBalance && (
                <p className="text-sm text-muted-foreground">
                  {Number(startingBalance).toLocaleString()}{" "}
                  {selectedCurrency.displayName}
                </p>
              )}
            </div>

            {/* Balance Date */}
            <div className="space-y-2">
              <Label>Balance As Of</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !balanceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {balanceDate ? (
                      format(balanceDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={balanceDate}
                    onSelect={(date) => date && setBalanceDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes (optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
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
                startingBalance === "" ||
                Number(startingBalance) < 0
              }
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Balance" : "Set Balance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default StartingBalanceDialog;
