// src/components/dashboard/DashboardProvider.tsx
import React from "react";
import {
  DashboardContext,
  DashboardProviderProps,
} from "@/contexts/DashboardContext";
import { useDashboardData } from "@/hooks/dashboard/useDashboardData";
import { DashboardConfig } from "@/types/dashboard";
import { Currency } from "@/types";
import { TimeframeTab } from "@/utils/transactionProcessor";

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

  // Use the dashboard data hook
  const dashboardState = useDashboardData(
    mergedConfig.defaultTimeframe,
    mergedConfig.defaultCurrency,
    mergedConfig.defaultUseStatementMonth,
    mergedConfig.defaultStatementDay
  );

  return (
    <DashboardContext.Provider value={dashboardState}>
      {children}
    </DashboardContext.Provider>
  );
}
