// pages/Index.tsx
import React from "react";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { CurrencyService } from "@/core/currency";

/**
 * Index page component that serves as the main dashboard entry point
 * Wraps the Dashboard with DashboardProvider and provides default configuration
 */
const IndexPage: React.FC = () => {
  // Default configuration values centralized here
  const dashboardConfig = {
    defaultCurrency: CurrencyService.getDefaultCurrency(),
    defaultTimeframe: "thisMonth",
    defaultStatementDay: 15,
    defaultUseStatementMonth: false,
  };

  return (
    <DashboardProvider config={dashboardConfig}>
      <Dashboard />
    </DashboardProvider>
  );
};

export default IndexPage;
