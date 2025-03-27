import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StatementCycleFilterProps {
  useStatementMonth: boolean;
  setUseStatementMonth: (value: boolean) => void;
  statementCycleDay: number;
  setStatementCycleDay: (value: number) => void;
  className?: string;
}

const StatementCycleFilter = ({
  useStatementMonth,
  setUseStatementMonth,
  statementCycleDay,
  setStatementCycleDay,
  className = ''
}: StatementCycleFilterProps) => {
  
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) return;
    
    // Ensure the day is between 1 and 31
    const validDay = Math.max(1, Math.min(31, value));
    setStatementCycleDay(validDay);
  };
  
  return (
    <div className={`flex items-center h-7 rounded-md ${className}`}>
      <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
      <Select
        value={useStatementMonth ? "statement" : "calendar"}
        onValueChange={(value) => setUseStatementMonth(value === "statement")}
      >
        <SelectTrigger className="w-[160px] h-7 text-sm bg-transparent border-none">
          <SelectValue placeholder="Calendar Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="statement">Statement Month</SelectItem>
          <SelectItem value="calendar">Calendar Month</SelectItem>
        </SelectContent>
      </Select>
      
      {useStatementMonth && (
        <div className="ml-2 flex items-center">
          <span className="text-sm text-muted-foreground mr-1">
            Day:
          </span>
          <Input
            id="statement-cycle-day"
            type="number"
            min={1}
            max={31}
            value={statementCycleDay}
            onChange={handleDayChange}
            className="h-7 w-14 text-xs px-2"
          />
        </div>
      )}
    </div>
  );
};

export default StatementCycleFilter;