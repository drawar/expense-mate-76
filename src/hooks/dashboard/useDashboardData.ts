
// src/hooks/dashboard/useDashboardData.ts
import { useState, useEffect, useCallback } from "react";
import { Transaction, PaymentMethod, Currency } from "@/types";
import { DashboardData, DashboardOptions } from "@/types/dashboard";
import { getTransactions, getPaymentMethods } from "@/utils/storageUtils";
import {
  supabase,
  USE_LOCAL_STORAGE_DEFAULT,
} from "@/integrations/supabase/client";
import { useDashboard } from "@/hooks/useDashboard";
import { TimeframeTab } from "@/utils/transactionProcessor";
import { tryCatchWrapper, ErrorType } from "@/utils/errorHandling";

export function useDashboardData(
  defaultTimeframe: TimeframeTab = "thisMonth",
  defaultCurrency: Currency = "SGD",
  defaultUseStatementMonth: boolean = false,
  defaultStatementCycleDay: number = 15
) {
  // State for data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // State for filters
  const [activeTab, setActiveTab] = useState<TimeframeTab>(defaultTimeframe);
  const [displayCurrency, setDisplayCurrency] =
    useState<Currency>(defaultCurrency);
  const [useStatementMonth, setUseStatementMonth] = useState<boolean>(
    defaultUseStatementMonth
  );
  const [statementCycleDay, setStatementCycleDay] = useState<number>(
    defaultStatementCycleDay
  );

  // Build dashboard options
  const dashboardOptions: DashboardOptions = {
    transactions,
    displayCurrency,
    timeframe: activeTab,
    useStatementMonth,
    statementCycleDay,
    calculateDayOfWeekMetrics: transactions.length > 0,
    lastUpdate,
  };

  // Get dashboard data
  const { dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useDashboard(dashboardOptions);

  // Load dashboard data with proper error handling
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get payment methods with error handling wrapper
      const loadedPaymentMethods = await tryCatchWrapper(
        async () => getPaymentMethods(),
        ErrorType.DATA_FETCH,
        { source: "getPaymentMethods" },
        [] as PaymentMethod[]
      );

      // Get transactions with error handling wrapper
      const allTransactions = await tryCatchWrapper(
        async () => getTransactions(USE_LOCAL_STORAGE_DEFAULT),
        ErrorType.DATA_FETCH,
        { source: "getTransactions" },
        [] as Transaction[]
      );

      // Filter out deleted transactions
      const loadedTransactions = allTransactions.filter((tx) => !tx.is_deleted);

      setTransactions(loadedTransactions);
      setPaymentMethods(loadedPaymentMethods);
      setError(null);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up Supabase realtime subscription for data updates
  useEffect(() => {
    // Load data immediately when component mounts
    loadData();

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
          // Force reload on any transaction changes
          loadData();
        }
      )
      .subscribe();

    // Cleanup: unsubscribe on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  return {
    // Data state
    transactions,
    paymentMethods,
    dashboardData,
    isLoading: isLoading || isDashboardLoading,
    error: error || dashboardError,
    lastUpdate,

    // Filter state
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,

    // Action handlers
    refreshData: loadData,
    setActiveTab,
    setDisplayCurrency,
    setUseStatementMonth,
    setStatementCycleDay,
  };
}
