// components/dashboard/layout/DashboardHeader.tsx
import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { TimeframeTab } from "@/utils/dashboard";

/**
 * Get human-readable period label for the current timeframe
 */
function getPeriodLabel(timeframe: TimeframeTab): string {
  const now = new Date();
  const monthNamesShort = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthNamesFull = [
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
      return `${monthNamesFull[now.getMonth()]} ${now.getFullYear()}`;
    case "lastMonth": {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return `${monthNamesFull[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`;
    }
    case "lastTwoMonths": {
      const startMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const startYear = startMonth.getFullYear();
      const endYear = now.getFullYear();
      if (startYear === endYear) {
        return `${monthNamesShort[startMonth.getMonth()]} - ${monthNamesShort[now.getMonth()]} ${endYear}`;
      }
      return `${monthNamesShort[startMonth.getMonth()]} ${startYear} - ${monthNamesShort[now.getMonth()]} ${endYear}`;
    }
    case "lastThreeMonths": {
      const startMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const startYear = startMonth.getFullYear();
      const endYear = now.getFullYear();
      if (startYear === endYear) {
        return `${monthNamesShort[startMonth.getMonth()]} - ${monthNamesShort[now.getMonth()]} ${endYear}`;
      }
      return `${monthNamesShort[startMonth.getMonth()]} ${startYear} - ${monthNamesShort[now.getMonth()]} ${endYear}`;
    }
    case "lastSixMonths": {
      const startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const startYear = startMonth.getFullYear();
      const endYear = now.getFullYear();
      if (startYear === endYear) {
        return `${monthNamesShort[startMonth.getMonth()]} - ${monthNamesShort[now.getMonth()]} ${endYear}`;
      }
      return `${monthNamesShort[startMonth.getMonth()]} ${startYear} - ${monthNamesShort[now.getMonth()]} ${endYear}`;
    }
    case "thisYear":
      return `${now.getFullYear()}`;
    default:
      return `${monthNamesFull[now.getMonth()]} ${now.getFullYear()}`;
  }
}

/**
 * Component that displays the contextual dashboard header with period
 */
const DashboardHeader: React.FC = () => {
  const { activeTab } = useDashboardContext();
  const periodLabel = getPeriodLabel(activeTab);

  return (
    <div className="mb-6 mt-4">
      <h1 className="text-2xl font-medium tracking-tight text-primary">
        {periodLabel}
      </h1>
    </div>
  );
};

export default React.memo(DashboardHeader);
