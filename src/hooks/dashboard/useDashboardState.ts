import { useState, useCallback } from "react";
import { Currency } from "@/types";
import { TimeframeTab } from "@/utils/transactionProcessor";

/**
 * Custom hook for managing dashboard UI state
 * Separates UI state management from data fetching
 */
export function useDashboardState(
  defaultTimeframe: TimeframeTab = "thisMonth",
  defaultCurrency: Currency = "SGD",
  defaultUseStatementMonth: boolean = false,
  defaultStatementCycleDay: number = 15
) {
  // Filter state
  const [activeTab, setActiveTab] = useState<TimeframeTab>(defaultTimeframe);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(defaultCurrency);
  const [useStatementMonth, setUseStatementMonth] = useState<boolean>(defaultUseStatementMonth);
  const [statementCycleDay, setStatementCycleDay] = useState<number>(defaultStatementCycleDay);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Memoized handler functions for better performance
  const refreshLastUpdate = useCallback(() => setLastUpdate(Date.now()), []);
  
  const handleActiveTabChange = useCallback((tab: TimeframeTab) => {
    setActiveTab(tab);
  }, []);
  
  const handleCurrencyChange = useCallback((currency: Currency) => {
    setDisplayCurrency(currency);
  }, []);
  
  const handleStatementMonthToggle = useCallback((value: boolean) => {
    setUseStatementMonth(value);
  }, []);
  
  const handleStatementCycleDayChange = useCallback((day: number) => {
    setStatementCycleDay(day);
  }, []);

  return {
    // Filter state
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    lastUpdate,

    // Action handlers
    refreshLastUpdate,
    setActiveTab: handleActiveTabChange,
    setDisplayCurrency: handleCurrencyChange,
    setUseStatementMonth: handleStatementMonthToggle,
    setStatementCycleDay: handleStatementCycleDayChange,
  };
}
