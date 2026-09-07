/**
 * Hook for managing payslips (income payments) with Supabase persistence
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, format, parseISO } from "date-fns";
import { Currency, RecurringIncome } from "@/types";
import type { IncomeFrequency } from "@/types/income";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TimeframeTab, getTimeframeDateRange } from "@/utils/dashboard";
import { syncBudgetPeriodForIncome } from "@/utils/budget/syncBudgetPeriod";
import { UserPreferencesService } from "@/core/preferences/UserPreferencesService";

interface RecurringIncomeSettings {
  /** All payslips */
  incomeSources: RecurringIncome[];
  /** Total income from payslips in selected timeframe */
  totalIncome: number;
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

/** Step forward one cycle: biweekly = +14d, monthly = +1 calendar month. */
function advance(d: Date, frequency: "biweekly" | "monthly"): Date {
  return frequency === "biweekly" ? addDays(d, 14) : addMonths(d, 1);
}

/**
 * Yield every occurrence of a recurring income within [fromDate, toDate],
 * inclusive, given the anchor `startDate` and its frequency. Occurrences
 * before the anchor are ignored (we don't project backward from the anchor).
 * Includes future occurrences within the window — this matches the "expected
 * income this month" mental model requested at feature design time.
 *
 * one_off returns the anchor date itself iff it falls inside the window;
 * never virtualized into a series.
 *
 * Returns date strings ("yyyy-MM-dd") to make caller-side dedup easy.
 */
function occurrencesInRange(
  startDate: string,
  frequency: IncomeFrequency,
  fromDate: string,
  toDate: string
): string[] {
  if (frequency === "one_off") {
    return startDate >= fromDate && startDate <= toDate ? [startDate] : [];
  }
  const from = parseISO(fromDate);
  const to = parseISO(toDate);
  let d = parseISO(startDate);
  // Advance to the first occurrence on or after `from`.
  while (d < from) d = advance(d, frequency);
  const out: string[] = [];
  // Hard cap to avoid runaway loops on pathological inputs.
  let safety = 400;
  while (d <= to && safety-- > 0) {
    out.push(format(d, "yyyy-MM-dd"));
    d = advance(d, frequency);
  }
  return out;
}

/**
 * Hook to manage payslips for a specific currency with timeframe filtering
 */
export function useRecurringIncome(
  displayCurrency: Currency,
  timeframe: TimeframeTab = "thisMonth"
): RecurringIncomeSettings {
  const { user } = useAuth();
  const queryClient = useQueryClient();
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

  // Calculate total income for the timeframe by virtualizing biweekly /
  // monthly occurrences from each row's (startDate, frequency) pattern.
  //
  // Example: one biweekly row anchored Aug 28, viewed for September, expands
  // to Sep 11 + Sep 25 → counted twice at the row's amount. This matches the
  // "expected income this month" model — future occurrences within the window
  // count, so a paycheck due later in the month is not silently zero.
  //
  // Dedupe is keyed on (name, currency, date) so that if the user has
  // multiple rows for the same salary at overlapping cadences, we don't
  // double-count occurrences that would land on the same day.
  const { totalIncome, totalAllTime } = useMemo(() => {
    const dateRange = getTimeframeDateRange(timeframe);

    const currencyFilteredPayslips = incomeSources.filter(
      (payslip) => payslip.currency === displayCurrency
    );

    // All-time total is a straight sum of literal rows (no virtualization).
    const allTimeTotal = currencyFilteredPayslips.reduce(
      (sum, payslip) => sum + payslip.amount,
      0
    );

    // No timeframe filter (e.g. "all time" view) → mirror the all-time total.
    if (!dateRange) {
      return { totalIncome: allTimeTotal, totalAllTime: allTimeTotal };
    }

    // Virtualize occurrences per row and dedupe by (name, currency, date).
    const perDayAmount = new Map<string, number>();
    for (const p of currencyFilteredPayslips) {
      if (!p.startDate) {
        // No anchor date — fall back to the literal, single-shot semantics.
        continue;
      }
      const occurrences = occurrencesInRange(
        p.startDate,
        p.frequency,
        dateRange.from,
        dateRange.to
      );
      const nameKey = p.name.trim().toLowerCase();
      for (const occ of occurrences) {
        perDayAmount.set(`${nameKey}|${p.currency}|${occ}`, p.amount);
      }
    }
    const timeframeTotal = Array.from(perDayAmount.values()).reduce(
      (a, b) => a + b,
      0
    );

    return { totalIncome: timeframeTotal, totalAllTime: allTimeTotal };
  }, [incomeSources, displayCurrency, timeframe]);

  // Save income (with pay-period-budget sync side-effect for salary rows)
  const saveIncome = useCallback(
    async (income: Omit<RecurringIncome, "createdAt" | "updatedAt">) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Read pre-image so the budget-period sync can decide insert vs update
      // vs "lost salary match" vs "currency changed". If this fails we still
      // proceed with the upsert; the sync just falls back to "no prev".
      let prev: { name: string; currency: string } | null = null;
      try {
        const { data } = await supabase
          .from("recurring_income")
          .select("name, currency")
          .eq("id", income.id)
          .maybeSingle();
        if (data) prev = { name: data.name, currency: data.currency };
      } catch (readErr) {
        console.warn(
          "[saveIncome] pre-image read failed, continuing:",
          readErr
        );
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

      // Pay-period budget side-effect. Best-effort — swallows its own errors
      // so a failed sync never rolls back the income save.
      const displayCurrency =
        (await UserPreferencesService.getDisplayCurrency()) ?? "CAD";
      await syncBudgetPeriodForIncome({
        supabase,
        userId: user.id,
        displayCurrency,
        next: income,
        prev,
      });
      queryClient.invalidateQueries({ queryKey: ["budget_periods"] });

      await loadIncome();
    },
    [user, loadIncome, queryClient]
  );

  // Delete income (ON DELETE CASCADE removes any linked budget_periods row)
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

      queryClient.invalidateQueries({ queryKey: ["budget_periods"] });
      await loadIncome();
    },
    [loadIncome, queryClient]
  );

  return {
    incomeSources,
    totalIncome,
    totalAllTime,
    isLoading,
    saveIncome,
    deleteIncome,
    refresh: loadIncome,
  };
}
