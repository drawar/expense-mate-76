/**
 * Hook for managing payslips (income payments) with Supabase persistence
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Currency, RecurringIncome } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TimeframeTab, getTimeframeDateRange } from "@/utils/dashboard";

interface RecurringIncomeSettings {
  /** All payslips */
  incomeSources: RecurringIncome[];
  /** Total income from payslips in selected timeframe */
  totalMonthlyIncome: number;
  /** Total income scaled to current timeframe (same as totalMonthlyIncome for payslips) */
  scaledTotalIncome: number;
  /** Total income from ALL payslips (ignores timeframe filter) */
  totalAllTime: number;
  /** Whether income is loading */
  isLoading: boolean;
  /** Add or update a payslip */
  saveIncome: (
    income: Omit<RecurringIncome, "createdAt" | "updatedAt">
  ) => Promise<void>;
  /** Delete a payslip */
  deleteIncome: (id: string) => Promise<void>;
  /** Refresh income data */
  refresh: () => Promise<void>;
}

/**
 * Check if a date string (YYYY-MM-DD) falls within a date range
 */
function isDateInRange(
  dateStr: string | undefined,
  from: string,
  to: string
): boolean {
  if (!dateStr) return false;
  return dateStr >= from && dateStr <= to;
}

/**
 * Hook to manage payslips for a specific currency with timeframe filtering
 */
export function useRecurringIncome(
  displayCurrency: Currency,
  timeframe: TimeframeTab = "thisMonth"
): RecurringIncomeSettings {
  const { user } = useAuth();
  const [incomeSources, setIncomeSources] = useState<RecurringIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load income from Supabase
  const loadIncome = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("recurring_income")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error loading payslips:", error);
        setIncomeSources([]);
        return;
      }

      const mapped: RecurringIncome[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        amount: Number(row.amount),
        currency: row.currency as Currency,
        frequency: row.frequency,
        dayOfMonth: row.day_of_month ?? undefined,
        startDate: row.start_date ?? undefined,
        isActive: row.is_active,
        notes: row.notes ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setIncomeSources(mapped);
    } catch (error) {
      console.error("Error loading payslips:", error);
      setIncomeSources([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadIncome();
  }, [loadIncome]);

  // Calculate total income by summing payslips within the timeframe
  const { totalMonthlyIncome, scaledTotalIncome, totalAllTime } =
    useMemo(() => {
      const dateRange = getTimeframeDateRange(timeframe);

      // Filter payslips by currency only (for all-time total)
      const currencyFilteredPayslips = incomeSources.filter(
        (payslip) => payslip.currency === displayCurrency
      );

      // Calculate all-time total (no date filter)
      const allTimeTotal = currencyFilteredPayslips.reduce(
        (sum, payslip) => sum + payslip.amount,
        0
      );

      // Filter by date range for timeframe-specific total
      const timeframeFilteredPayslips = currencyFilteredPayslips.filter(
        (payslip) => {
          // If no date range, include all
          if (!dateRange) return true;
          // Check if payslip date falls within range
          return isDateInRange(payslip.startDate, dateRange.from, dateRange.to);
        }
      );

      // Sum the amounts for timeframe
      const timeframeTotal = timeframeFilteredPayslips.reduce(
        (sum, payslip) => sum + payslip.amount,
        0
      );

      return {
        totalMonthlyIncome: timeframeTotal,
        scaledTotalIncome: timeframeTotal,
        totalAllTime: allTimeTotal,
      };
    }, [incomeSources, displayCurrency, timeframe]);

  // Save income
  const saveIncome = useCallback(
    async (income: Omit<RecurringIncome, "createdAt" | "updatedAt">) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("recurring_income").upsert(
        {
          id: income.id,
          user_id: user.id,
          name: income.name,
          amount: income.amount,
          currency: income.currency,
          frequency: income.frequency,
          day_of_month: income.dayOfMonth ?? null,
          start_date: income.startDate ?? null,
          is_active: income.isActive,
          notes: income.notes ?? null,
        },
        { onConflict: "id" }
      );

      if (error) {
        console.error("Error saving payslip:", error);
        throw error;
      }

      await loadIncome();
    },
    [user, loadIncome]
  );

  // Delete income
  const deleteIncome = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("recurring_income")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting payslip:", error);
        throw error;
      }

      await loadIncome();
    },
    [loadIncome]
  );

  return {
    incomeSources,
    totalMonthlyIncome,
    scaledTotalIncome,
    totalAllTime,
    isLoading,
    saveIncome,
    deleteIncome,
    refresh: loadIncome,
  };
}
