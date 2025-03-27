import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencyOptions } from '@/utils/currencyFormatter';
import { Currency } from '@/types';
import { DollarSign } from 'lucide-react';

interface DisplayCurrencySelectProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
}

const DisplayCurrencySelect = ({ value, onChange, className = '' }: DisplayCurrencySelectProps) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <DollarSign className="h-5 w-5 text-muted-foreground" />
      <Select
        value={value} 
        onValueChange={(value: string) => onChange(value as Currency)}
        defaultValue="SGD"
      >
        <SelectTrigger className="w-[80px] h-7 text-sm bg-transparent border-none">
          <SelectValue placeholder="SGD" />
        </SelectTrigger>
        <SelectContent>
          {currencyOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DisplayCurrencySelect;
