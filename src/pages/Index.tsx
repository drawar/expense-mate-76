// src/pages/Index.tsx
import React from "react";
import { DashboardProvider } from "@/components/dashboard/DashboardProvider";
import { Dashboard } from "@/components/dashboard/Dashboard";

const Index = () => {
  return (
    <DashboardProvider
      config={{
        defaultCurrency: "SGD",
        defaultTimeframe: "thisMonth",
        defaultStatementDay: 15,
        defaultUseStatementMonth: false,
      }}
    >
      <Dashboard />
    </DashboardProvider>
  );
};

export default Index;
