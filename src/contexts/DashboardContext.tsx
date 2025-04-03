
// src/contexts/DashboardContext.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { Transaction, PaymentMethod, Currency } from "@/types";
import { DashboardData } from "@/types/dashboard";
import { TimeframeTab } from "@/utils/transactionProcessor";
import { RewardCalculationService } from "@/services/RewardCalculationService";

export interface DashboardContextState {
  // Data state
  transactions: Transaction[];
  paymentMethods: PaymentMethod[];
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;

  // Filter state
  activeTab: TimeframeTab;
  displayCurrency: Currency;
  useStatementMonth: boolean;
  statementCycleDay: number;

  // Services
  rewardCalculationService: RewardCalculationService;

  // Action handlers
  refreshData: () => Promise<void>;
  setActiveTab: (tab: TimeframeTab) => void;
  setDisplayCurrency: (currency: Currency) => void;
  setUseStatementMonth: (use: boolean) => void;
  setStatementCycleDay: (day: number) => void;
}

// Create context with a default undefined value
const DashboardContext = createContext<DashboardContextState | undefined>(
  undefined
);

// Custom hook to use the dashboard context
export function useDashboardContext() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider"
    );
  }
  return context;
}

// Provider props type
interface DashboardProviderProps {
  children: ReactNode;
}

// The actual Provider component will be implemented in DashboardProvider.tsx

export { DashboardContext };
export type { DashboardProviderProps };
