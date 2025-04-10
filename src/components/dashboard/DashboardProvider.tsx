// components/dashboard/DashboardProvider.tsx
import React from "react";
import {
  DashboardContext,
  DashboardProviderProps,
  DashboardConfig
} from "@/contexts/DashboardContext";
import { useDashboard } from "@/hooks/useDashboard";
import { rewardCalculatorService } from "@/services/rewards/RewardCalculatorService";

interface ExtendedDashboardProviderProps extends DashboardProviderProps {
  config?: Partial<DashboardConfig>;
}

export function DashboardProvider({
  children,
  config,
}: ExtendedDashboardProviderProps) {
  // Default configuration values
  const defaultConfig: DashboardConfig = {
    defaultCurrency: "SGD",
    defaultTimeframe: "thisMonth",
    defaultStatementDay: 15,
    defaultUseStatementMonth: false,
  };

  // Merge provided config with defaults
  const mergedConfig = { ...defaultConfig, ...config };

  // Use the enhanced useDashboard hook
  const {
    transactions,
    paymentMethods,
    dashboardData,
    isLoading,
    error,
    lastUpdate,
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    refreshData,
    setActiveTab,
    setDisplayCurrency,
    setUseStatementMonth,
    setStatementCycleDay,
  } = useDashboard({
    defaultTimeframe: mergedConfig.defaultTimeframe,
    defaultCurrency: mergedConfig.defaultCurrency,
    defaultUseStatementMonth: mergedConfig.defaultUseStatementMonth,
    defaultStatementCycleDay: mergedConfig.defaultStatementDay,
  });

  // Create the context value
  const contextValue = React.useMemo(() => ({
    // Data
    transactions,
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
    
    // Services
    rewardCalculatorService,

    // Actions
    refreshData,
    setActiveTab,
    setDisplayCurrency,
    setUseStatementMonth,
    setStatementCycleDay,
  }), [
    transactions, 
    paymentMethods, 
    dashboardData, 
    isLoading, 
    error, 
    lastUpdate,
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    refreshData
  ]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}
