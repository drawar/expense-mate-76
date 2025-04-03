
import React from "react";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Configure React Query client with optimal settings for this application
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

/**
 * Index page component that serves as the main dashboard entry point
 * Wraps the Dashboard with DashboardProvider and provides default configuration
 */
const IndexPage: React.FC = () => {
  // Default configuration values centralized here
  const dashboardConfig = {
    defaultCurrency: "SGD",
    defaultTimeframe: "thisMonth",
    defaultStatementDay: 15,
    defaultUseStatementMonth: false,
  } as const;

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardProvider config={dashboardConfig}>
        <Dashboard />
      </DashboardProvider>
    </QueryClientProvider>
  );
};

export default IndexPage;
