// components/dashboard/filters/TimeframeSelect.tsx
import React from "react";
import { TimeframeTab } from "@/utils/dashboard";
import { cn } from "@/lib/utils";

export interface TimeframeSelectProps {
  value: TimeframeTab;
  onChange: (value: TimeframeTab) => void;
  className?: string;
}

const timeframeOptions: {
  value: TimeframeTab;
  label: string;
  shortLabel: string;
}[] = [
  { value: "thisMonth", label: "This Month", shortLabel: "1M" },
  { value: "lastTwoMonths", label: "2 Months", shortLabel: "2M" },
  { value: "lastThreeMonths", label: "3 Months", shortLabel: "3M" },
  { value: "lastSixMonths", label: "6 Months", shortLabel: "6M" },
  { value: "thisYear", label: "This Year", shortLabel: "YTD" },
];

/**
 * Horizontal tab bar for selecting dashboard timeframe
 */
const TimeframeSelect: React.FC<TimeframeSelectProps> = ({
  value,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-lg bg-muted/50 w-full",
        className
      )}
    >
      {timeframeOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all",
            value === option.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <span className="sm:hidden">{option.shortLabel}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default React.memo(TimeframeSelect);
