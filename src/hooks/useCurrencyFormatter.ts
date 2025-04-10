// src/hooks/useCurrencyFormatter.ts
import { useMemo, useCallback } from "react";
import { Currency } from "@/types";
import { CurrencyService } from "@/services/CurrencyService";

/**
 * Custom hook that provides memoized currency formatting functions
 * to prevent unnecessary re-renders and duplicate log messages
 */
export function useCurrencyFormatter(defaultCurrency: Currency = "SGD") {
  // Create memoized formatter function that maintains referential equality
  const formatCurrency = useCallback(
    (amount: number, currency: Currency = defaultCurrency): string => {
      return CurrencyService.format(amount, currency);
    },
    [defaultCurrency]
  );

  // Create formatter cache for repeated values in a single render cycle
  const cachedFormatters = useMemo(() => {
    const cache = new Map<string, string>();

    return {
      format: (
        amount: number,
        currency: Currency = defaultCurrency
      ): string => {
        const key = `${amount}-${currency}`;
        if (!cache.has(key)) {
          cache.set(key, CurrencyService.format(amount, currency));
        }
        return cache.get(key)!;
      },

      // Clear cache when currency changes
      clear: () => cache.clear(),
    };
  }, [defaultCurrency]);

  return {
    formatCurrency,
    cachedFormat: cachedFormatters.format,
    clearCache: cachedFormatters.clear,
  };
}

/**
 * Hook specifically designed for chart components that need
 * to format multiple currency values efficiently
 */
export function useChartCurrencyFormatter(currency: Currency = "SGD") {
  // Create tooltip formatter function for recharts
  const tooltipFormatter = useCallback(
    (value: number, name: string) => {
      return [CurrencyService.format(value, currency), name];
    },
    [currency]
  );

  // Create axis formatter function for recharts
  const axisFormatter = useCallback(
    (value: number) => {
      return CurrencyService.format(value, currency);
    },
    [currency]
  );

  return {
    tooltipFormatter,
    axisFormatter,
    currency,
  };
}
