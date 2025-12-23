// components/dashboard/filters/TimeframeSelect.tsx
import React from "react";
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
    <div className={className}>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="w-full h-9 text-sm bg-transparent border-none">
          <SelectValue placeholder="This Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="thisMonth">This Month</SelectItem>
          {/* <SelectItem value="lastMonth">Last Month</SelectItem> */}
          <SelectItem value="lastTwoMonths">Last 2 Months</SelectItem>
          <SelectItem value="lastThreeMonths">Last 3 Months</SelectItem>
          <SelectItem value="lastSixMonths">Last 6 Months</SelectItem>
          <SelectItem value="thisYear">This Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(TimeframeSelect);
