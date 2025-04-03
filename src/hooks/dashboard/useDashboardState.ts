
import { useState } from "react";
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
  const [displayCurrency, setDisplayCurrency] =
    useState<Currency>(defaultCurrency);
  const [useStatementMonth, setUseStatementMonth] = useState<boolean>(
    defaultUseStatementMonth
  );
  const [statementCycleDay, setStatementCycleDay] = useState<number>(
    defaultStatementCycleDay
  );
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Refresh lastUpdate timestamp
  const refreshLastUpdate = () => setLastUpdate(Date.now());

  return {
    // Filter state
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    lastUpdate,

    // Action handlers
    refreshLastUpdate,
    setActiveTab,
    setDisplayCurrency,
    setUseStatementMonth,
    setStatementCycleDay,
  };
}
