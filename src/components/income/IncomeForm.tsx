import React, { useState, useEffect } from "react";
import { RecurringIncome, Currency } from "@/types";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";

interface IncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    income: Omit<RecurringIncome, "createdAt" | "updatedAt">
  ) => Promise<void>;
  editingIncome: RecurringIncome | null;
  defaultCurrency: Currency;
}

const CURRENCIES: Currency[] = ["USD", "CAD", "SGD", "EUR", "GBP", "AUD"];

export const IncomeForm: React.FC<IncomeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingIncome,
  defaultCurrency,
}) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [payDate, setPayDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or editing income changes
  useEffect(() => {
    if (isOpen) {
      if (editingIncome) {
        setName(editingIncome.name);
        setAmount(editingIncome.amount.toString());
        setCurrency(editingIncome.currency);
        setPayDate(editingIncome.startDate || "");
        setNotes(editingIncome.notes || "");
        setIsActive(editingIncome.isActive);
      } else {
        setName("");
        setAmount("");
        setCurrency(defaultCurrency);
        setPayDate("");
        setNotes("");
        setIsActive(true);
      }
    }
  }, [isOpen, editingIncome, defaultCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const income: Omit<RecurringIncome, "createdAt" | "updatedAt"> = {
        id: editingIncome?.id || uuidv4(),
        name: name.trim(),
        amount: parseFloat(amount),
        currency,
        frequency: "monthly", // Default to monthly
        startDate: payDate || undefined,
        isActive,
        notes: notes.trim() || undefined,
      };

      await onSubmit(income);
      onClose();
    } catch (error) {
      console.error("Error saving income:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingIncome ? "Edit Income" : "Add Income"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Primary Salary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as Currency)}
              >
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payDate">Pay Date (optional)</Label>
            <Input
              id="payDate"
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive" className="cursor-pointer">
              Active
            </Label>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingIncome
                  ? "Save Changes"
                  : "Add Income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
