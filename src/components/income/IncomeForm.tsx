import React, { useState, useEffect, useMemo } from "react";
import { RecurringIncome, Currency } from "@/types";
import { format } from "date-fns";
import { CalendarIcon, CheckIcon } from "lucide-react";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

interface IncomeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    income: Omit<RecurringIncome, "createdAt" | "updatedAt">
  ) => Promise<void>;
  editingIncome: RecurringIncome | null;
  defaultCurrency: Currency;
  /** List of existing payslip names for autocomplete suggestions */
  existingNames?: string[];
}

const CURRENCIES: Currency[] = ["USD", "CAD", "SGD", "EUR", "GBP", "AUD"];

export const IncomeForm: React.FC<IncomeFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingIncome,
  defaultCurrency,
  existingNames = [],
}) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [namePopoverOpen, setNamePopoverOpen] = useState(false);

  // Get unique names for suggestions, filtered by current input
  const nameSuggestions = useMemo(() => {
    const uniqueNames = [...new Set(existingNames)].sort();
    if (!name.trim()) return uniqueNames;
    const query = name.toLowerCase();
    return uniqueNames.filter((n) => n.toLowerCase().includes(query));
  }, [existingNames, name]);

  // Reset form when dialog opens/closes or editing income changes
  useEffect(() => {
    if (isOpen) {
      if (editingIncome) {
        setName(editingIncome.name);
        setAmount(editingIncome.amount.toString());
        setCurrency(editingIncome.currency);
        // Parse date string to Date object (local timezone)
        if (editingIncome.startDate) {
          const [year, month, day] = editingIncome.startDate
            .split("-")
            .map(Number);
          setDate(new Date(year, month - 1, day));
        } else {
          setDate(undefined);
        }
        setNotes(editingIncome.notes || "");
      } else {
        setName("");
        setAmount("");
        setCurrency(defaultCurrency);
        setDate(undefined);
        setNotes("");
      }
    }
  }, [isOpen, editingIncome, defaultCurrency]);

  // Convert Date to YYYY-MM-DD string in local timezone
  const formatDateToString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !amount || parseFloat(amount) <= 0 || !date) {
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
        startDate: formatDateToString(date),
        isActive: true, // Always active for payslips
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
            {editingIncome ? "Edit Payslip" : "Add Payslip"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Popover open={namePopoverOpen} onOpenChange={setNamePopoverOpen}>
              <PopoverTrigger asChild>
                <Input
                  id="name"
                  className="text-left"
                  placeholder="e.g., Salary"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!namePopoverOpen && e.target.value.length > 0) {
                      setNamePopoverOpen(true);
                    }
                  }}
                  onFocus={() => {
                    if (nameSuggestions.length > 0) {
                      setNamePopoverOpen(true);
                    }
                  }}
                  required
                  autoComplete="off"
                />
              </PopoverTrigger>
              {nameSuggestions.length > 0 && (
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <Command>
                    <CommandList>
                      <CommandGroup>
                        {nameSuggestions.map((suggestion) => (
                          <CommandItem
                            key={suggestion}
                            value={suggestion}
                            onSelect={() => {
                              setName(suggestion);
                              setNamePopoverOpen(false);
                            }}
                          >
                            {suggestion}
                            {name === suggestion && (
                              <CheckIcon className="ml-auto h-4 w-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
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
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
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

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !date}>
              {isSubmitting
                ? "Saving..."
                : editingIncome
                  ? "Save Changes"
                  : "Add Payslip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
