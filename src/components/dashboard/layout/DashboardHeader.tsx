// components/dashboard/layout/DashboardHeader.tsx
import React from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { useCurrencyFormatter } from "@/hooks/useCurrencyFormatter";
import { TimeframeTab } from "@/utils/dashboard";

/**
 * Get human-readable period label for the current timeframe
 */
function getPeriodLabel(timeframe: TimeframeTab): string {
  const now = new Date();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  switch (timeframe) {
    case "thisMonth":
      return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    case "lastMonth": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;
    }
    case "lastThreeMonths":
      return "Last 3 Months";
    case "thisYear":
      return `${now.getFullYear()}`;
    case "lastYear":
      return `${now.getFullYear() - 1}`;
    case "thisWeek":
      return "This Week";
    case "lastWeek":
      return "Last Week";
    case "allTime":
      return "All Time";
    default:
      return "Custom Period";
  }
}

/**
 * Component that displays the contextual dashboard header with period and spending
 */
const DashboardHeader: React.FC = () => {
  const { dashboardData, displayCurrency, activeTab } = useDashboardContext();
  const { formatCurrency } = useCurrencyFormatter(displayCurrency);

  const metrics = dashboardData?.metrics || {
    totalExpenses: 0,
    totalReimbursed: 0,
  };
  const netExpenses =
    (metrics.totalExpenses || 0) - (metrics.totalReimbursed || 0);
  const periodLabel = getPeriodLabel(activeTab);

  return (
    <div className="flex items-center justify-between mb-6 mt-4">
      <div>
        <h1 className="text-2xl font-medium tracking-tight text-primary">
          {periodLabel}
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {formatCurrency(netExpenses)} spent
        </p>
      </div>

      <ThemeToggle />
    </div>
  );
};

export default React.memo(DashboardHeader);
