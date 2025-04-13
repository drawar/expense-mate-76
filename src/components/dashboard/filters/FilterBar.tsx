// components/dashboard/filters/FilterBar.tsx
import React from "react";
import { Filter } from "lucide-react";
import { TimeframeTab } from "@/utils/dashboard";
import { Currency } from "@/types";
import DisplayCurrencySelect from "./DisplayCurrencySelect";
import StatementCycleFilter from "./StatementCycleFilter";
import TimeframeSelect from "./TimeframeSelect";
import "@/components/dashboard/styles/dashboard-filters.css";

/**
 * Props for the FilterBar component
 */
interface FilterBarProps {
  filters: {
    activeTab: TimeframeTab;
    displayCurrency: Currency;
    useStatementMonth: boolean;
    statementCycleDay: number;
    handleTimeframeChange: (value: TimeframeTab) => void;
    handleCurrencyChange: (currency: Currency) => void;
    handleStatementMonthToggle: (value: boolean) => void;
    handleStatementCycleDayChange: (day: number) => void;
  };
  className?: string;
}

/**
 * Global filter bar component for dashboard that unifies all filter controls
 */
const FilterBar: React.FC<FilterBarProps> = ({ filters, className = "" }) => {
  const {
    activeTab,
    displayCurrency,
    useStatementMonth,
    statementCycleDay,
    handleTimeframeChange,
    handleCurrencyChange,
    handleStatementMonthToggle,
    handleStatementCycleDayChange,
  } = filters;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Currency Selector */}
      <div className="flex items-center h-10">
        <DisplayCurrencySelect
          value={displayCurrency}
          onChange={handleCurrencyChange}
          className="component-hover-box"
        />
      </div>

      {/* Time Frame Selector */}
      <div className="flex items-center h-10 component-hover-box">
        <Filter className="h-5 w-5 text-muted-foreground mr-2" />
        <TimeframeSelect 
          value={activeTab} 
          onChange={handleTimeframeChange} 
        />
      </div>

      {/* Statement Month toggle */}
      <div className="flex items-center h-10">
        <StatementCycleFilter
          useStatementMonth={useStatementMonth}
          setUseStatementMonth={handleStatementMonthToggle}
          statementCycleDay={statementCycleDay}
          setStatementCycleDay={handleStatementCycleDayChange}
          className="component-hover-box"
        />
      </div>
    </div>
  );
};

export default React.memo(FilterBar);
