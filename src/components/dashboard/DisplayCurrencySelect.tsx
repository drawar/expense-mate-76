
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencyOptions } from '@/utils/currencyFormatter';
import { Currency } from '@/types';

interface DisplayCurrencySelectProps {
  value: Currency;
  onChange: (currency: Currency) => void;
}

const DisplayCurrencySelect = ({ value, onChange }: DisplayCurrencySelectProps) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Display Currency:</span>
      <Select 
        value={value} 
        onValueChange={(value: string) => onChange(value as Currency)}
      >
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue placeholder="Select currency" />
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
