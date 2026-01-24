// components/dashboard/layout/DashboardHeader.tsx
import React from "react";
import { useDashboardContext } from "@/contexts/DashboardContext";
import { TimeframeTab } from "@/utils/dashboard";
import TimeframeSelect from "@/components/dashboard/filters/TimeframeSelect";

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
 * Component that displays the contextual dashboard header with period and timeframe tabs
 */
const DashboardHeader: React.FC = () => {
  const { activeTab, setActiveTab } = useDashboardContext();
  const periodLabel = getPeriodLabel(activeTab);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[25%_1fr] gap-4 items-center mb-6 mt-4">
      <h1 className="text-2xl font-medium tracking-tight text-gradient">
        {periodLabel}
      </h1>
      <TimeframeSelect
        value={activeTab}
        onChange={setActiveTab}
        className="w-full"
      />
    </div>
  );
};

export default React.memo(DashboardHeader);
