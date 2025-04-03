
import React from "react";
import {
  DashboardContext,
  DashboardProviderProps,
} from "@/contexts/DashboardContext";
import { useDashboardState } from "@/hooks/dashboard/useDashboardState";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { usePaymentMethodsQuery } from "@/hooks/queries/usePaymentMethodsQuery";
import { DashboardConfig } from "@/types/dashboard";
import { Currency } from "@/types";
import { TimeframeTab } from "@/utils/transactionProcessor";
import { useDashboard } from "@/hooks/useDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ExtendedDashboardProviderProps extends DashboardProviderProps {
  config?: Partial<DashboardConfig>;
}

export function DashboardProvider({
  children,
  config,
}: ExtendedDashboardProviderProps) {
  // Default configuration values
  const defaultConfig: DashboardConfig = {
    defaultCurrency: "SGD" as Currency,
    defaultTimeframe: "thisMonth" as TimeframeTab,
    defaultStatementDay: 15,
    defaultUseStatementMonth: false,
  };

  // Merge provided config with defaults
  const mergedConfig = { ...defaultConfig, ...config };

  // React Query client for cache invalidation
  const queryClient = useQueryClient();

  // Dashboard state hooks
  const dashboardState = useDashboardState(
    mergedConfig.defaultTimeframe,
    mergedConfig.defaultCurrency,
    mergedConfig.defaultUseStatementMonth,
    mergedConfig.defaultStatementDay
  );

  // Data query hooks
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

  // Combined loading and error states
  const isLoading = isTransactionsLoading || isPaymentMethodsLoading;
  const error = transactionsError || paymentMethodsError
    ? "Failed to load dashboard data"
    : null;

  // Process dashboard data with the filtered transactions
  const { dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboard({
    transactions,
    displayCurrency: dashboardState.displayCurrency,
    timeframe: dashboardState.activeTab,
    useStatementMonth: dashboardState.useStatementMonth,
    statementCycleDay: dashboardState.statementCycleDay,
    calculateDayOfWeekMetrics: transactions.length > 0,
    lastUpdate: dashboardState.lastUpdate,
  });

  // Set up Supabase realtime subscription for data updates
  React.useEffect(() => {
    // Set up real-time subscriptions
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
          dashboardState.refreshLastUpdate();
        }
      )
      .subscribe();

    // Cleanup: unsubscribe on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, dashboardState]);

  // Create a wrapper function for refreshData that returns void
  const refreshData = async (): Promise<void> => {
    try {
      await refetchTransactions();
      dashboardState.refreshLastUpdate();
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  // Combine all state and data for the context
  const contextValue = {
    // Data
    transactions,
    paymentMethods,
    dashboardData,
    
    // Status
    isLoading: isLoading || isDashboardLoading,
    error: error || dashboardError,
    lastUpdate: dashboardState.lastUpdate,

    // Filter state
    activeTab: dashboardState.activeTab,
    displayCurrency: dashboardState.displayCurrency,
    useStatementMonth: dashboardState.useStatementMonth,
    statementCycleDay: dashboardState.statementCycleDay,

    // Actions
    refreshData,
    setActiveTab: dashboardState.setActiveTab,
    setDisplayCurrency: dashboardState.setDisplayCurrency,
    setUseStatementMonth: dashboardState.setUseStatementMonth,
    setStatementCycleDay: dashboardState.setStatementCycleDay,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
