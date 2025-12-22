/**
 * Hook for accessing user's monthly budget settings
 */

import { useState, useEffect } from "react";
import { Currency } from "@/types";

const BUDGET_STORAGE_KEY = "expense-mate-monthly-budget";

interface BudgetSettings {
  monthlyBudget: number;
  setBudget: (amount: number, currency: Currency) => void;
}

/**
 * Hook to get and set monthly budget for a specific currency
 */
export function useBudget(currency: Currency): BudgetSettings {
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);

  // Load budget from localStorage on mount and when currency changes
  useEffect(() => {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed[currency]) {
          setMonthlyBudget(parsed[currency]);
        } else {
          setMonthlyBudget(0);
        }
      } catch {
        setMonthlyBudget(0);
      }
    }
  }, [currency]);

  // Save budget to localStorage
  const setBudget = (amount: number, targetCurrency: Currency) => {
    const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
    const budgets = stored ? JSON.parse(stored) : {};
    budgets[targetCurrency] = amount;
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
    if (targetCurrency === currency) {
      setMonthlyBudget(amount);
    }
  };

  return {
    monthlyBudget,
    setBudget,
  };
}

/**
 * Simple function to get budget without hook (for services)
 */
export function getBudgetForCurrency(currency: Currency): number {
  const stored = localStorage.getItem(BUDGET_STORAGE_KEY);
  if (!stored) return 0;

  try {
    const parsed = JSON.parse(stored);
    return parsed[currency] || 0;
  } catch {
    return 0;
  }
}
