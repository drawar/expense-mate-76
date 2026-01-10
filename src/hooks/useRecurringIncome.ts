/**
 * Hook for managing recurring income sources with Supabase persistence
 */

import { useState, useEffect, useCallback } from "react";
import { Currency, RecurringIncome, IncomeFrequency } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TimeframeTab } from "@/utils/dashboard";

interface RecurringIncomeSettings {
  /** All income sources */
  incomeSources: RecurringIncome[];
  /** Total monthly income (scaled from all sources) */
  totalMonthlyIncome: number;
  /** Total income scaled to current timeframe */
  scaledTotalIncome: number;
  /** Whether income is loading */
  isLoading: boolean;
  /** Add or update an income source */
  saveIncome: (
    income: Omit<RecurringIncome, "createdAt" | "updatedAt">
  ) => Promise<void>;
  /** Delete an income source */
  deleteIncome: (id: string) => Promise<void>;
  /** Refresh income data */
  refresh: () => Promise<void>;
}

/**
 * Scale income based on frequency to monthly equivalent
 * Biweekly: 26 pay periods per year / 12 months = ~2.17 per month
 */
function getMonthlyEquivalent(
  amount: number,
  frequency: IncomeFrequency
): number {
  if (frequency === "biweekly") {
    return amount * (26 / 12); // ~2.17
  }
  return amount; // monthly
}

/**
 * Scale income for timeframe (similar to budget scaling)
 */
function scaleIncomeForTimeframe(
  monthlyAmount: number,
  timeframe: TimeframeTab
): number {
  const timeframeMultipliers: Record<TimeframeTab, number> = {
    thisMonth: 1,
    lastMonth: 1,
    lastTwoMonths: 2,
    lastThreeMonths: 3,
    lastSixMonths: 6,
    thisYear: 12,
  };
  return monthlyAmount * (timeframeMultipliers[timeframe] || 1);
}

/**
 * Hook to manage recurring income sources for a specific currency with timeframe scaling
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
        .order("name");

      if (error) {
        console.error("Error loading recurring income:", error);
        setIncomeSources([]);
        return;
      }

      const mapped: RecurringIncome[] = (data || []).map((row) => ({
        id: row.id,
        name: row.name,
        amount: Number(row.amount),
        currency: row.currency as Currency,
        frequency: row.frequency as IncomeFrequency,
        dayOfMonth: row.day_of_month ?? undefined,
        startDate: row.start_date ?? undefined,
        isActive: row.is_active,
        notes: row.notes ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setIncomeSources(mapped);
    } catch (error) {
      console.error("Error loading recurring income:", error);
      setIncomeSources([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadIncome();
  }, [loadIncome]);

  // Calculate totals for display currency only
  // TODO: Add currency conversion for multi-currency support
  const totalMonthlyIncome = incomeSources
    .filter((inc) => inc.isActive && inc.currency === displayCurrency)
    .reduce(
      (sum, inc) => sum + getMonthlyEquivalent(inc.amount, inc.frequency),
      0
    );

  const scaledTotalIncome = scaleIncomeForTimeframe(
    totalMonthlyIncome,
    timeframe
  );

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
        console.error("Error saving recurring income:", error);
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
        console.error("Error deleting recurring income:", error);
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
    isLoading,
    saveIncome,
    deleteIncome,
    refresh: loadIncome,
  };
}
