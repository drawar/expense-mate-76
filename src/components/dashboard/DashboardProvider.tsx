// components/dashboard/DashboardProvider.tsx
import React from "react";
import {
  DashboardContext,
  DashboardProviderProps,
  DashboardConfig
} from "@/contexts/DashboardContext";
import { useDashboard } from "@/hooks/dashboard";

/**
 * Provider component that makes dashboard data available to all components
 */
export function DashboardProvider({ children, config }: DashboardProviderProps) {
  // Default configuration values
  const defaultConfig: DashboardConfig = {
    defaultCurrency: "SGD",
    defaultTimeframe: "thisMonth",
    defaultStatementDay: 15,
    defaultUseStatementMonth: false,
  };

  // Merge provided config with defaults
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Use the dashboard hook to manage all data and state
  const dashboardState = useDashboard({
    defaultTimeframe: mergedConfig.defaultTimeframe,
    defaultCurrency: mergedConfig.defaultCurrency,
    defaultStatementCycleDay: mergedConfig.defaultStatementDay,
    defaultUseStatementMonth: mergedConfig.defaultUseStatementMonth,
  });

  return (
    <DashboardContext.Provider value={dashboardState}>
      {children}
    </DashboardContext.Provider>
  );
}

export default DashboardProvider;
