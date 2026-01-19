import { useFormContext } from "react-hook-form";
import { MossInput } from "@/components/ui/moss-input";
import { MossCard } from "@/components/ui/moss-card";
import { Receipt } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Import from our centralized currency service
import { CurrencyService } from "@/core/currency/CurrencyService";

export const SimulatorTransactionDetails: React.FC = () => {
  const form = useFormContext();

  // Get currency options from our service
  const currencyOptions = CurrencyService.getCurrencyOptions();

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
                <Select value={field.value} onValueChange={field.onChange}>
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
      </div>
    </MossCard>
  );
};
