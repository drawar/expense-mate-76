import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, ClockIcon, InfoIcon } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { MossCard } from "@/components/ui/moss-card";
import { MossInput } from "@/components/ui/moss-input";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

// Import from our centralized currency service
import { CurrencyService } from "@/core/currency/CurrencyService";

interface TransactionDetailsSectionProps {
  minimal?: boolean; // Enable progressive disclosure mode
}

export const TransactionDetailsSection: React.FC<
  TransactionDetailsSectionProps
> = ({
  minimal = true, // Default to minimal view with progressive disclosure
}) => {
  const form = useFormContext();
  const currency = form.watch("currency");
  const mcc = form.watch("mcc");

  // Get currency options from our service
  const currencyOptions = CurrencyService.getCurrencyOptions();

  // Allow negative values only for MCC 6540 (POI Funding Transactions)
  const allowNegativeAmount = mcc?.code === "6540";

  return (
    <MossCard>
      <h2
        className="section-header flex items-center gap-2"
        style={{
          fontSize: "var(--font-size-section-header)",
          fontWeight: 600,
          color: "var(--color-text-primary)",
          marginBottom: "var(--space-lg)",
        }}
      >
        <CalendarIcon
          className="h-5 w-5"
          style={{ color: "var(--color-icon-primary)" }}
        />
        Transaction Details
      </h2>

      {/* Essential fields - always visible */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Transaction Amount
                  {allowNegativeAmount && (
                    <span className="text-xs text-muted-foreground ml-2 font-normal">
                      (positive or negative)
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <MossInput
                    type="number"
                    min={allowNegativeAmount ? undefined : "0.01"}
                    step="0.01"
                    placeholder={allowNegativeAmount ? "0.00 (+ or -)" : "0.00"}
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      // Update payment amount automatically when transaction amount changes
                      const currentPaymentMethod =
                        form.getValues("paymentMethodId");
                      if (currentPaymentMethod) {
                        form.setValue("paymentAmount", e.target.value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  defaultValue="CAD"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-10 px-3 text-left font-normal justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <span className="truncate">
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </span>
                        <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => {
              // Get current time for display when field is empty
              const getCurrentTimeString = () => format(new Date(), "HH:mm");

              return (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <div className="relative w-full">
                      <input
                        type="time"
                        className={cn(
                          "h-10 w-full rounded-md border border-input bg-background px-3 text-sm",
                          "placeholder:text-muted-foreground",
                          "focus-visible:outline-none focus-visible:border-[var(--color-accent)] focus-visible:shadow-[0_0_0_2px_var(--color-accent-subtle)]",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          "transition-[border-color,box-shadow] duration-150",
                          "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
                          !field.value && "text-muted-foreground"
                        )}
                        value={field.value || getCurrentTimeString()}
                        onChange={(e) => {
                          field.onChange(e.target.value || undefined);
                        }}
                      />
                      <ClockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
      </div>

      {/* Optional fields - collapsible */}
      {minimal && (
        <CollapsibleSection
          trigger="Show transaction details"
          id="transaction-advanced"
          persistState={true}
        >
          <div className="space-y-4">
            {/* Reimbursement Amount Field */}
            <FormField
              control={form.control}
              name="reimbursementAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="inline-flex items-center gap-1.5">
                    Reimbursement Amount
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Amount reimbursed for this expense (in {currency})
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <MossInput
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    style={{
                      fontSize: "var(--font-size-label)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this transaction"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CollapsibleSection>
      )}

      {/* Non-minimal mode - show all fields */}
      {!minimal && (
        <div className="space-y-4 mt-4">
          {/* Reimbursement Amount Field */}
          <FormField
            control={form.control}
            name="reimbursementAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="inline-flex items-center gap-1.5">
                  Reimbursement Amount
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Amount reimbursed for this expense (in {currency})
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </FormLabel>
                <FormControl>
                  <MossInput
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes Field */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel
                  style={{
                    fontSize: "var(--font-size-label)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Notes (Optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any notes about this transaction"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </MossCard>
  );
};
