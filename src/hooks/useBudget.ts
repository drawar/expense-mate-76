/**
 * Hook for accessing user's budget settings with Supabase persistence
 */

import { useState, useEffect, useCallback } from "react";
import { Currency } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TimeframeTab } from "@/utils/dashboard";

export type BudgetPeriodType = "weekly" | "monthly";

interface BudgetData {
  amount: number;
  periodType: BudgetPeriodType;
}

interface BudgetSettings {
  /** The budget amount scaled to the current timeframe */
  scaledBudget: number;
  /** The raw budget amount as stored */
  rawBudget: number;
  /** The budget period type (weekly/monthly) */
  periodType: BudgetPeriodType;
  /** Whether the budget is loading */
  isLoading: boolean;
  /** Set the budget with amount, currency, and period type */
  setBudget: (
    amount: number,
    currency: Currency,
    periodType: BudgetPeriodType
  ) => Promise<void>;
}

/**
 * Scale budget based on timeframe
 * Weekly budget: multiply by weeks in timeframe
 * Monthly budget: multiply by months in timeframe
 */
function scaleBudgetForTimeframe(
  amount: number,
  periodType: BudgetPeriodType,
  timeframe: TimeframeTab
): number {
  if (amount === 0) return 0;

  // Define approximate multipliers for each timeframe
  // Based on: weekly = 4.33 weeks/month, monthly = 1 month
  const timeframeMultipliers: Record<
    TimeframeTab,
    { weeks: number; months: number }
  > = {
    thisMonth: { weeks: 4.33, months: 1 },
    lastMonth: { weeks: 4.33, months: 1 },
    lastTwoMonths: { weeks: 8.66, months: 2 },
    lastThreeMonths: { weeks: 13, months: 3 },
    lastSixMonths: { weeks: 26, months: 6 },
    thisYear: { weeks: 52, months: 12 },
  };

  const multipliers = timeframeMultipliers[timeframe] || {
    weeks: 4.33,
    months: 1,
  };

  if (periodType === "weekly") {
    return amount * multipliers.weeks;
  } else {
    return amount * multipliers.months;
  }
}

/**
 * Hook to get and set budget for a specific currency with timeframe scaling
 */
export function useBudget(
  currency: Currency,
  timeframe: TimeframeTab = "thisMonth"
): BudgetSettings {
  const { user } = useAuth();
  const [budgetData, setBudgetData] = useState<BudgetData>({
    amount: 0,
    periodType: "monthly",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load budget from Supabase on mount and when currency/user changes
  useEffect(() => {
    const loadBudget = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("budgets")
          .select("amount, period_type")
          .eq("user_id", user.id)
          .eq("currency", currency)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 = no rows found, which is fine
          console.error("Error loading budget:", error);
        }

        if (data) {
          setBudgetData({
            amount: Number(data.amount),
            periodType: data.period_type as BudgetPeriodType,
          });
        } else {
          setBudgetData({ amount: 0, periodType: "monthly" });
        }
      } catch (error) {
        console.error("Error loading budget:", error);
        setBudgetData({ amount: 0, periodType: "monthly" });
      } finally {
        setIsLoading(false);
      }
    };

    loadBudget();
  }, [user, currency]);

  // Save budget to Supabase
  const setBudget = useCallback(
    async (
      amount: number,
      targetCurrency: Currency,
      periodType: BudgetPeriodType
    ) => {
      if (!user) {
        console.warn("Cannot save budget: user not authenticated");
        return;
      }

      try {
        const { error } = await supabase.from("budgets").upsert(
          {
            user_id: user.id,
            currency: targetCurrency,
            amount,
            period_type: periodType,
          },
          {
            onConflict: "user_id,currency",
          }
        );

        if (error) {
          console.error("Error saving budget:", error);
          throw error;
        }

        // Update local state if it's the current currency
        if (targetCurrency === currency) {
          setBudgetData({ amount, periodType });
        }
      } catch (error) {
        console.error("Error saving budget:", error);
        throw error;
      }
    },
    [user, currency]
  );

  // Calculate scaled budget based on timeframe
  const scaledBudget = scaleBudgetForTimeframe(
    budgetData.amount,
    budgetData.periodType,
    timeframe
  );

  return {
    scaledBudget,
    rawBudget: budgetData.amount,
    periodType: budgetData.periodType,
    isLoading,
    setBudget,
  };
}

/**
 * Simple function to get budget without hook (for services)
 * Note: This is a synchronous fallback that returns 0 - use the hook for actual data
 */
export function getBudgetForCurrency(currency: Currency): number {
  // This function is kept for backward compatibility but returns 0
  // The actual budget should be loaded via useBudget hook
  console.warn(
    "getBudgetForCurrency is deprecated. Use useBudget hook instead."
  );
  return 0;
}
