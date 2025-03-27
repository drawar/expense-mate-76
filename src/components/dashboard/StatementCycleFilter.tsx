import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Calendar } from 'lucide-react';

interface StatementCycleFilterProps {
  useStatementMonth: boolean;
  setUseStatementMonth: (value: boolean) => void;
  statementCycleDay: number;
  setStatementCycleDay: (value: number) => void;
}

const StatementCycleFilter = ({
  useStatementMonth,
  setUseStatementMonth,
  statementCycleDay,
  setStatementCycleDay
}: StatementCycleFilterProps) => {
  
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) return;
    
    // Ensure the day is between 1 and 31
    const validDay = Math.max(1, Math.min(31, value));
    setStatementCycleDay(validDay);
  };
  
  // Using a key to force re-render when toggle is clicked to prevent hanging
  const toggleId = `statement-cycle-toggle-${useStatementMonth ? 'on' : 'off'}`;
  
  return (
    <div className="flex items-center h-7 rounded-md">
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium">Statement Month:</span>
        <Switch
          id={toggleId}
          checked={useStatementMonth}
          onCheckedChange={setUseStatementMonth}
          className="scale-75"
        />
      </div>
      
      {useStatementMonth && (
        <div className="ml-2 flex items-center">
          <span className="text-xs text-muted-foreground mr-1">
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