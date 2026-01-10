// hooks/dashboard/useDashboard.ts
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Currency } from "@/types";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { usePaymentMethodsQuery } from "@/hooks/queries/usePaymentMethodsQuery";
import { useFilteredTransactions } from "./useFilteredTransactions";
import { useDashboardMetrics } from "./useDashboardMetrics";
import { supabase } from "@/integrations/supabase/client";
import { TimeframeTab } from "@/utils/dashboard";
import { useQueryClient } from "@tanstack/react-query";

// Valid timeframe values for URL validation
const VALID_TIMEFRAMES: TimeframeTab[] = [
  "thisMonth",
  "lastMonth",
  "lastTwoMonths",
  "lastThreeMonths",
  "lastSixMonths",
  "thisYear",
];

// Valid currency values for URL validation
const VALID_CURRENCIES: Currency[] = ["USD", "CAD", "SGD", "EUR", "GBP", "AUD"];

/**
 * Main hook that provides all dashboard data and state
 */
export function useDashboard(options: {
  defaultTimeframe?: TimeframeTab;
  defaultCurrency?: Currency;
  defaultUseStatementMonth?: boolean;
  defaultStatementCycleDay?: number;
}) {
  const {
    defaultTimeframe = "thisMonth",
    defaultCurrency = "SGD",
    defaultUseStatementMonth = false,
    defaultStatementCycleDay = 15,
  } = options;

  // URL search params for filter persistence
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse URL params with validation, falling back to defaults
  const getInitialTimeframe = (): TimeframeTab => {
    const param = searchParams.get("timeframe");
    if (param && VALID_TIMEFRAMES.includes(param as TimeframeTab)) {
      return param as TimeframeTab;
    }
    return defaultTimeframe;
  };

  const getInitialCurrency = (): Currency => {
    const param = searchParams.get("currency");
    if (param && VALID_CURRENCIES.includes(param as Currency)) {
      return param as Currency;
    }
    return defaultCurrency;
  };

  // State for filters - initialized from URL params
  const [activeTab, setActiveTabState] =
    useState<TimeframeTab>(getInitialTimeframe);
  const [displayCurrency, setDisplayCurrencyState] =
    useState<Currency>(getInitialCurrency);
  const [useStatementMonth, setUseStatementMonth] = useState<boolean>(
    defaultUseStatementMonth
  );
  const [statementCycleDay, setStatementCycleDay] = useState<number>(
    defaultStatementCycleDay
  );
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // Wrapped setters that also update URL params
  const setActiveTab = useCallback(
    (tab: TimeframeTab) => {
      setActiveTabState(tab);
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("timeframe", tab);
          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const setDisplayCurrency = useCallback(
    (currency: Currency) => {
      setDisplayCurrencyState(currency);
      setSearchParams(
        (prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("currency", currency);
          return newParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Sync URL to state on initial load (handles browser back/forward)
  useEffect(() => {
    const urlTimeframe = searchParams.get("timeframe");
    const urlCurrency = searchParams.get("currency");

    if (
      urlTimeframe &&
      VALID_TIMEFRAMES.includes(urlTimeframe as TimeframeTab)
    ) {
      setActiveTabState(urlTimeframe as TimeframeTab);
    }
    if (urlCurrency && VALID_CURRENCIES.includes(urlCurrency as Currency)) {
      setDisplayCurrencyState(urlCurrency as Currency);
    }
  }, [searchParams]);

  // React Query client for cache invalidation
  const queryClient = useQueryClient();

  // Data queries
  const {
    data: transactions = [],
    isLoading: isTransactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionsQuery();

  // Include inactive payment methods so analytics show data from all cards (including closed ones)
  const {
    data: paymentMethods = [],
    isLoading: isPaymentMethodsLoading,
    error: paymentMethodsError,
  } = usePaymentMethodsQuery({ includeInactive: true });

  // Get filtered transactions based on current filters
  const { filteredTransactions, previousPeriodTransactions } =
    useFilteredTransactions(
      transactions,
      activeTab,
      useStatementMonth,
      statementCycleDay,
      lastUpdate
    );

  // Calculate dashboard metrics
  const {
    dashboardData,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = useDashboardMetrics({
    filteredTransactions,
    previousPeriodTransactions,
    displayCurrency,
    calculateDayOfWeekMetrics: true,
  });

  // Combined loading and error states
  const isLoading =
    isTransactionsLoading || isPaymentMethodsLoading || isMetricsLoading;
  const error =
    transactionsError || paymentMethodsError || metricsError
      ? "Failed to load dashboard data"
      : null;

  // Refresh function
  const refreshData = async (): Promise<void> => {
    try {
      await refetchTransactions();
      setLastUpdate(Date.now());
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Set up Supabase realtime subscription for data updates
  useEffect(() => {
    const channel = supabase
      .channel("dashboard_transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
        },
        () => {
          // Invalidate the transactions query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
          setLastUpdate(Date.now());
        }
      )
      .subscribe();

    // Cleanup: unsubscribe on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    // Data
    transactions,
    filteredTransactions,
    previousPeriodTransactions,
    paymentMethods,
    dashboardData,

    // Status
    isLoading,
    error,
    lastUpdate,

    // Filter state
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,

    // Actions
    refreshData,
    setActiveTab,
    setDisplayCurrency,
    setUseStatementMonth,
    setStatementCycleDay,
  };
}
