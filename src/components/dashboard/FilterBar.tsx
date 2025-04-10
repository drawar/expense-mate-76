// components/dashboard/FilterBar.tsx
import React from "react";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DisplayCurrencySelect from "./DisplayCurrencySelect";
import StatementCycleFilter from "./StatementCycleFilter";
import { TimeframeTab } from "@/utils/transactionProcessor";
import { Currency } from "@/types";
import "./dashboard-filters.css";

/**
 * Props for the FilterBar component
 */
interface FilterBarProps {
  filters: {
    activeTab: string;
    displayCurrency: Currency;
    useStatementMonth: boolean;
    statementCycleDay: number;
    handleTimeframeChange: (value: string) => void;
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
        <Select value={activeTab} onValueChange={handleTimeframeChange}>
          <SelectTrigger className="w-[120px] h-8 text-sm bg-transparent border-none">
            <SelectValue placeholder="This Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="thisMonth">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="lastThreeMonths">Last 3 Months</SelectItem>
            <SelectItem value="thisYear">This Year</SelectItem>
          </SelectContent>
        </Select>
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
