import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { MossInput } from "@/components/ui/moss-input";
import { MossCard } from "@/components/ui/moss-card";
import { CalendarIcon, AlertCircle, Receipt } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import from our centralized currency service
import { CurrencyService } from "@/core/currency/CurrencyService";

export const SimulatorTransactionDetails: React.FC = () => {
  const form = useFormContext();
  const currency = form.watch("currency");
  const amount = form.watch("amount");
  const convertedAmount = form.watch("convertedAmount");

  // Get currency options from our service
  const currencyOptions = CurrencyService.getCurrencyOptions();

  // Determine if we're dealing with a foreign currency transaction
  const isForeignCurrency = currency && currency !== "CAD";
  const showConvertedAmountField = isForeignCurrency;
  const showWarning = isForeignCurrency && amount && !convertedAmount;

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
        <Receipt
          className="h-5 w-5"
          style={{ color: "var(--color-icon-primary)" }}
        />
        Transaction Details
      </h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Amount</FormLabel>
                <FormControl>
                  <MossInput
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
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
                    // Reset converted amount when currency changes
                    form.setValue("convertedAmount", "");
                    form.setValue("convertedCurrency", "CAD");
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

        {/* Converted Amount Field - shown when foreign currency is selected */}
        {showConvertedAmountField && (
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="convertedAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Converted Amount (CAD)</FormLabel>
                  <FormControl>
                    <MossInput
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the amount in CAD that will be charged to your card
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Warning when conversion not provided */}
        {showWarning && (
          <Alert
            variant="default"
            className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
          >
            <AlertCircle
              className="h-4 w-4 text-yellow-600 dark:text-yellow-500"
              style={{ strokeWidth: 2.5 }}
            />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              Foreign currency detected. Enter the converted amount in CAD for
              accurate reward calculations. Without this, conversion rates may
              affect actual rewards earned.
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon
                        className="ml-auto h-4 w-4 opacity-50"
                        style={{ strokeWidth: 2.5 }}
                      />
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
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
    </MossCard>
  );
};
