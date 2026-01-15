/**
 * StartingBalanceDialog - Form dialog for setting starting balance for a currency
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
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
import { Loader2, CoinsIcon, CalendarIcon, CreditCardIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { PointsBalance, PointsBalanceInput } from "@/core/points/types";
import type { RewardCurrency } from "@/core/currency/types";
import type { PaymentMethod } from "@/types";
import { cardTypeIdService } from "@/core/rewards/CardTypeIdService";

interface StartingBalanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: PointsBalanceInput) => Promise<void>;
  rewardCurrencies: RewardCurrency[];
  paymentMethods?: PaymentMethod[]; // For card-specific balance selection
  existingBalance?: PointsBalance; // For editing
  defaultCurrencyId?: string;
  isLoading?: boolean;
}

export function StartingBalanceDialog({
  isOpen,
  onClose,
  onSubmit,
  rewardCurrencies,
  paymentMethods = [],
  existingBalance,
  defaultCurrencyId,
  isLoading = false,
}: StartingBalanceDialogProps) {
  const isEditing = !!existingBalance;

  // Form state
  const [rewardCurrencyId, setRewardCurrencyId] = useState(
    defaultCurrencyId || ""
  );
  const [cardTypeId, setCardTypeId] = useState<string>("");
  const [startingBalance, setStartingBalance] = useState("");
  const [balanceDate, setBalanceDate] = useState<Date>(new Date());
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");

  // Get card types that earn the selected currency
  const cardTypesForCurrency = useMemo(() => {
    if (!rewardCurrencyId) return [];

    // Get unique card types from payment methods that earn this currency
    const cardTypes = new Map<string, { id: string; name: string }>();
    paymentMethods
      .filter(
        (pm) =>
          pm.rewardCurrencyId === rewardCurrencyId && pm.type === "credit_card"
      )
      .forEach((pm) => {
        const typeId = cardTypeIdService.generateCardTypeId(
          pm.issuer || "",
          pm.name
        );
        if (!cardTypes.has(typeId)) {
          cardTypes.set(typeId, {
            id: typeId,
            name: pm.issuer ? `${pm.issuer} ${pm.name}` : pm.name,
          });
        }
      });
    return Array.from(cardTypes.values());
  }, [rewardCurrencyId, paymentMethods]);

  // Show card type selector when there are card types available for the selected currency
  const showCardTypeSelector = cardTypesForCurrency.length > 0;

  // Reset form when dialog opens/closes or balance changes
  useEffect(() => {
    if (isOpen) {
      if (existingBalance) {
        setRewardCurrencyId(existingBalance.rewardCurrencyId);
        setCardTypeId(existingBalance.cardTypeId || "");
        setStartingBalance(String(existingBalance.startingBalance));
        setBalanceDate(existingBalance.balanceDate || new Date());
        setExpiryDate(existingBalance.expiryDate);
        setNotes(existingBalance.notes || "");
      } else {
        setRewardCurrencyId(defaultCurrencyId || "");
        setCardTypeId("");
        setStartingBalance("");
        setBalanceDate(new Date());
        setExpiryDate(undefined);
        setNotes("");
      }
    }
  }, [isOpen, existingBalance, defaultCurrencyId]);

  // Reset card type when currency changes
  useEffect(() => {
    if (!isEditing) {
      setCardTypeId("");
    }
  }, [rewardCurrencyId, isEditing]);

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
      cardTypeId:
        cardTypeId && cardTypeId !== "__pooled__" ? cardTypeId : undefined,
      startingBalance: numStartingBalance,
      balanceDate,
      expiryDate,
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

            {/* Card Type (for transferable currencies with multiple cards) */}
            {showCardTypeSelector && (
              <div className="space-y-2">
                <Label htmlFor="cardType">
                  <span className="flex items-center gap-2">
                    <CreditCardIcon className="h-4 w-4" />
                    Card Type (optional)
                  </span>
                </Label>
                <Select
                  value={cardTypeId}
                  onValueChange={setCardTypeId}
                  disabled={isEditing && !!existingBalance?.cardTypeId}
                >
                  <SelectTrigger id="cardType">
                    <SelectValue placeholder="Pooled balance (all cards)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__pooled__">
                      Pooled balance (all cards)
                    </SelectItem>
                    {cardTypesForCurrency.map((cardType) => (
                      <SelectItem key={cardType.id} value={cardType.id}>
                        {cardType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Some programs have separate point pools per card. Select a
                  specific card to track its balance separately.
                </p>
              </div>
            )}

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
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  side="top"
                  sideOffset={4}
                >
                  <Calendar
                    mode="single"
                    selected={balanceDate}
                    onSelect={(date) => date && setBalanceDate(date)}
                    defaultMonth={balanceDate}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Expiry Date (optional) */}
            <div className="space-y-2">
              <Label>Expiry Date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? (
                      format(expiryDate, "PPP")
                    ) : (
                      <span>No expiry date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  side="top"
                  sideOffset={4}
                >
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    defaultMonth={expiryDate || new Date()}
                    initialFocus
                  />
                  {expiryDate && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground"
                        onClick={() => setExpiryDate(undefined)}
                      >
                        Clear expiry date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes (optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes (supports markdown)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
              {notes.trim() && (
                <div className="rounded-md border p-3 bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground prose-p:my-1 prose-headings:my-2 prose-headings:font-semibold">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {notes}
                    </ReactMarkdown>
                  </div>
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
