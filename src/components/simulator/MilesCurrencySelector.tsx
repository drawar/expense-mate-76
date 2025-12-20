import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConversionService } from "@/core/currency";
import type { MilesCurrencyType } from "@/core/currency/types";

interface MilesCurrencySelectorProps {
  /**
   * Currently selected miles currency ID
   */
  value: string;

  /**
   * Callback when selection changes - passes the miles currency ID
   */
  onChange: (currencyId: string) => void;

  /**
   * Optional: specific currencies to show (by ID). If not provided, fetches all from DB.
   */
  availableCurrencyIds?: string[];
}

/**
 * Compact single-line dropdown for selecting miles currency
 *
 * Features:
 * - Fetches currencies from database
 * - Compact single-line layout with "Miles currency:" label
 * - Moss-green highlight for selected item
 * - Supports all major miles programs
 *
 * @component
 */
export function MilesCurrencySelector({
  value,
  onChange,
  availableCurrencyIds,
}: MilesCurrencySelectorProps) {
  const [currencies, setCurrencies] = useState<MilesCurrencyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrencies = async () => {
      setIsLoading(true);
      try {
        const conversionService = ConversionService.getInstance();
        const allCurrencies = await conversionService.getMilesCurrencies();

        // Filter if specific IDs provided
        if (availableCurrencyIds && availableCurrencyIds.length > 0) {
          setCurrencies(
            allCurrencies.filter((c) => availableCurrencyIds.includes(c.id))
          );
        } else {
          setCurrencies(allCurrencies);
        }

        // If no value set and we have currencies, select the first one
        if (!value && allCurrencies.length > 0) {
          onChange(allCurrencies[0].id);
        }
      } catch (error) {
        console.error("Error fetching miles currencies:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrencies();
  }, [availableCurrencyIds]);

  // Find the display name for the current value
  const selectedCurrency = currencies.find((c) => c.id === value);

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="miles-currency-select"
        className="text-sm font-medium whitespace-nowrap"
      >
        Miles currency:
      </label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger
          id="miles-currency-select"
          className="w-[200px] h-9 focus:ring-[#a3b18a] dark:focus:ring-[#a3b18a]"
        >
          <SelectValue
            placeholder={isLoading ? "Loading..." : "Select currency"}
          >
            {selectedCurrency?.displayName || "Select currency"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="min-w-[200px]">
          {currencies.map((currency) => (
            <SelectItem
              key={currency.id}
              value={currency.id}
              className="data-[state=checked]:bg-[#a3b18a]/10 data-[state=checked]:text-[#a3b18a] dark:data-[state=checked]:bg-[#a3b18a]/20 dark:data-[state=checked]:text-[#a3b18a]"
            >
              {currency.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Re-export for backward compatibility during transition
export type { MilesCurrencyType };
