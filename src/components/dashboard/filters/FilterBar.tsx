// components/dashboard/filters/FilterBar.tsx
import React from "react";
import { TimeframeTab } from "@/utils/dashboard";
import { Currency } from "@/types";
import DisplayCurrencySelect from "./DisplayCurrencySelect";
import TimeframeSelect from "./TimeframeSelect";
import "@/components/dashboard/styles/dashboard-filters.css";

/**
 * Props for the FilterBar component
 */
interface FilterBarProps {
  filters: {
    activeTab: TimeframeTab;
    displayCurrency: Currency;
    handleTimeframeChange: (value: TimeframeTab) => void;
    handleCurrencyChange: (currency: Currency) => void;
  };
  className?: string;
}

/**
 * Compact filter bar - single row with currency and timeframe selectors
 */
const FilterBar: React.FC<FilterBarProps> = ({ filters, className = "" }) => {
  const {
    activeTab,
    displayCurrency,
    handleTimeframeChange,
    handleCurrencyChange,
  } = filters;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DisplayCurrencySelect
        value={displayCurrency}
        onChange={handleCurrencyChange}
        className="flex-1"
      />
      <TimeframeSelect
        value={activeTab}
        onChange={handleTimeframeChange}
        className="flex-1"
      />
    </div>
  );
};

export default React.memo(FilterBar);
