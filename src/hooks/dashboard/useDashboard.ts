// hooks/dashboard/useDashboard.ts
import { useState, useEffect } from "react";
import { Currency } from "@/types";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { usePaymentMethodsQuery } from "@/hooks/queries/usePaymentMethodsQuery";
import { useFilteredTransactions } from "./useFilteredTransactions";
import { useDashboardMetrics } from "./useDashboardMetrics";
import { supabase } from "@/integrations/supabase/client";
import { TimeframeTab } from '@/utils/dashboard';
import { useQueryClient } from "@tanstack/react-query";

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

  // State for filters
  const [activeTab, setActiveTab] = useState<TimeframeTab>(defaultTimeframe);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>(defaultCurrency);
  const [useStatementMonth, setUseStatementMonth] = useState<boolean>(defaultUseStatementMonth);
  const [statementCycleDay, setStatementCycleDay] = useState<number>(defaultStatementCycleDay);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // React Query client for cache invalidation
  const queryClient = useQueryClient();

  // Data queries
  const {
    data: transactions = [],
    isLoading: isTransactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionsQuery();

  const {
    data: paymentMethods = [],
    isLoading: isPaymentMethodsLoading,
    error: paymentMethodsError,
  } = usePaymentMethodsQuery();

  // Get filtered transactions based on current filters
  const { 
    filteredTransactions,
    previousPeriodTransactions
  } = useFilteredTransactions(
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
    error: metricsError
  } = useDashboardMetrics({
    filteredTransactions,
    previousPeriodTransactions,
    displayCurrency,
    calculateDayOfWeekMetrics: true,
  });

  // Combined loading and error states
  const isLoading = isTransactionsLoading || isPaymentMethodsLoading || isMetricsLoading;
  const error = transactionsError || paymentMethodsError || metricsError
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
