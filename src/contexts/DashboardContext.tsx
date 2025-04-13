// contexts/DashboardContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { Transaction, PaymentMethod, Currency } from "@/types";
import { DashboardData } from "@/types/dashboard";
import { TimeframeTab } from "@/utils/dashboard";

// Define the context interface
export interface DashboardContextProps {
  // Data state
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  previousPeriodTransactions: Transaction[];
  paymentMethods: PaymentMethod[];
  dashboardData: DashboardData | null;
  
  // Status
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;

  // Filter state
  activeTab: TimeframeTab;
  displayCurrency: Currency;
  useStatementMonth: boolean;
  statementCycleDay: number;

  // Actions
  refreshData: () => Promise<void>;
  setActiveTab: (tab: TimeframeTab) => void;
  setDisplayCurrency: (currency: Currency) => void;
  setUseStatementMonth: (use: boolean) => void;
  setStatementCycleDay: (day: number) => void;
}

// Configuration interface
export interface DashboardConfig {
  defaultCurrency: Currency;
  defaultTimeframe: TimeframeTab;
  defaultStatementDay: number;
  defaultUseStatementMonth: boolean;
}

// Provider props type
export interface DashboardProviderProps {
  children: ReactNode;
  config?: Partial<DashboardConfig>;
}

// Create context with undefined default value
const DashboardContext = createContext<DashboardContextProps | undefined>(undefined);

// Custom hook to use the dashboard context
export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
}

// Export context
export { DashboardContext };
