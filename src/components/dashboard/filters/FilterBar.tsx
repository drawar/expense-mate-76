// components/dashboard/filters/FilterBar.tsx
import React from "react";
import { TimeframeTab } from "@/utils/dashboard";
import TimeframeSelect from "./TimeframeSelect";
import "@/components/dashboard/styles/dashboard-filters.css";

/**
 * Props for the FilterBar component
 */
interface FilterBarProps {
  filters: {
    activeTab: TimeframeTab;
    handleTimeframeChange: (value: TimeframeTab) => void;
  };
  className?: string;
}

/**
 * Compact filter bar - timeframe selector only
 * (Currency is now configured in Settings)
 */
const FilterBar: React.FC<FilterBarProps> = ({ filters, className = "" }) => {
  const { activeTab, handleTimeframeChange } = filters;

  return (
    <div className={className}>
      <TimeframeSelect
        value={activeTab}
        onChange={handleTimeframeChange}
        className="w-full"
      />
    </div>
  );
};

export default React.memo(FilterBar);
