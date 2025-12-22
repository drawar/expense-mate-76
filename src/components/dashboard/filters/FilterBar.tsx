// components/dashboard/filters/FilterBar.tsx
import React, { useState } from "react";
import { SlidersHorizontal, Calendar, Check } from "lucide-react";
import { TimeframeTab } from "@/utils/dashboard";
import { Currency } from "@/types";
import DisplayCurrencySelect from "./DisplayCurrencySelect";
import TimeframeSelect from "./TimeframeSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
 * Compact filter bar - single row with currency, timeframe, and filter options
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

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) return;
    const validDay = Math.max(1, Math.min(31, value));
    handleStatementCycleDayChange(validDay);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Currency Selector */}
      <DisplayCurrencySelect
        value={displayCurrency}
        onChange={handleCurrencyChange}
        className="component-hover-box h-9 px-2 rounded-lg"
      />

      {/* Timeframe Selector */}
      <div className="component-hover-box h-9 px-2 rounded-lg flex items-center">
        <TimeframeSelect value={activeTab} onChange={handleTimeframeChange} />
      </div>

      {/* Filter Options Popover */}
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-11 w-11 p-0 component-hover-box rounded-lg ${useStatementMonth ? "text-primary" : ""}`}
            aria-label="Filter options"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="end">
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Date Mode
            </p>

            {/* Calendar Month Option */}
            <button
              onClick={() => handleStatementMonthToggle(false)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[44px] ${
                !useStatementMonth
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm flex-1 text-left">Calendar Month</span>
              {!useStatementMonth && <Check className="h-4 w-4" />}
            </button>

            {/* Statement Month Option */}
            <button
              onClick={() => handleStatementMonthToggle(true)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[44px] ${
                useStatementMonth
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="text-sm flex-1 text-left">Statement Month</span>
              {useStatementMonth && <Check className="h-4 w-4" />}
            </button>

            {/* Statement Day Input */}
            {useStatementMonth && (
              <div className="pt-2 border-t border-border">
                <label className="text-xs text-muted-foreground">
                  Statement cycle starts on day:
                </label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={statementCycleDay}
                  onChange={handleDayChange}
                  className="h-8 mt-1.5"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default React.memo(FilterBar);
