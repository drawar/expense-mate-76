// components/dashboard/filters/TimeframeSelect.tsx
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimeframeTab } from "@/utils/dashboard";

export interface TimeframeSelectProps {
  value: TimeframeTab;
  onChange: (value: TimeframeTab) => void;
  className?: string;
}

/**
 * Component for selecting dashboard timeframe
 */
const TimeframeSelect: React.FC<TimeframeSelectProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const handleChange = (newValue: string) => {
    onChange(newValue as TimeframeTab);
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className={`w-[120px] h-8 text-sm bg-transparent border-none ${className}`}>
        <SelectValue placeholder="This Month" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="thisMonth">This Month</SelectItem>
        <SelectItem value="lastMonth">Last Month</SelectItem>
        <SelectItem value="lastThreeMonths">Last 3 Months</SelectItem>
        <SelectItem value="thisYear">This Year</SelectItem>
        <SelectItem value="lastYear">Last Year</SelectItem>
        <SelectItem value="thisWeek">This Week</SelectItem>
        <SelectItem value="lastWeek">Last Week</SelectItem>
        <SelectItem value="allTime">All Time</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default React.memo(TimeframeSelect);
