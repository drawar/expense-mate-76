
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
  
  return (
    <div className="flex flex-col space-y-2 bg-card p-3 rounded-lg border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="statement-cycle-toggle" className="text-sm font-medium">
            Statement Month
          </Label>
        </div>
        <Switch
          id="statement-cycle-toggle"
          checked={useStatementMonth}
          onCheckedChange={setUseStatementMonth}
        />
      </div>
      
      {useStatementMonth && (
        <div className="pt-2">
          <Label htmlFor="statement-cycle-day" className="text-xs text-muted-foreground mb-1 block">
            Statement Cycle Day
          </Label>
          <Input
            id="statement-cycle-day"
            type="number"
            min={1}
            max={31}
            value={statementCycleDay}
            onChange={handleDayChange}
            className="h-8 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Show transactions from day {statementCycleDay} of previous month to day {statementCycleDay === 31 ? 30 : statementCycleDay - 1} of current month.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatementCycleFilter;
