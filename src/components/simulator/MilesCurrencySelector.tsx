import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MilesCurrency } from '@/core/currency';

/**
 * Available miles currency options
 */
export const MILES_CURRENCIES: MilesCurrency[] = [
  'KrisFlyer',
  'AsiaMiles',
  'Avios',
  'FlyingBlue',
  'Aeroplan',
  'Velocity',
];

/**
 * Display names for miles currencies
 */
const MILES_CURRENCY_LABELS: Record<MilesCurrency, string> = {
  KrisFlyer: 'KrisFlyer',
  AsiaMiles: 'Asia Miles',
  Avios: 'Avios',
  FlyingBlue: 'Flying Blue',
  Aeroplan: 'Aeroplan',
  Velocity: 'Velocity',
};

interface MilesCurrencySelectorProps {
  /**
   * Currently selected miles currency
   */
  value: MilesCurrency;
  
  /**
   * Callback when selection changes
   */
  onChange: (currency: MilesCurrency) => void;
  
  /**
   * Available currency options (defaults to all)
   */
  availableCurrencies?: MilesCurrency[];
}

/**
 * Compact single-line dropdown for selecting miles currency
 * 
 * Features:
 * - Compact single-line layout with "Miles currency:" label
 * - Default selection: Aeroplan
 * - Moss-green highlight for selected item
 * - Supports all major miles programs
 * 
 * @component
 */
export function MilesCurrencySelector({
  value,
  onChange,
  availableCurrencies = MILES_CURRENCIES,
}: MilesCurrencySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label 
        htmlFor="miles-currency-select" 
        className="text-sm font-medium whitespace-nowrap"
      >
        Miles currency:
      </label>
      <Select
        value={value}
        onValueChange={(newValue) => onChange(newValue as MilesCurrency)}
      >
        <SelectTrigger 
          id="miles-currency-select"
          className="w-[180px] h-9 focus:ring-[#a3b18a] dark:focus:ring-[#a3b18a]"
        >
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {availableCurrencies.map((currency) => (
            <SelectItem
              key={currency}
              value={currency}
              className="data-[state=checked]:bg-[#a3b18a]/10 data-[state=checked]:text-[#a3b18a] dark:data-[state=checked]:bg-[#a3b18a]/20 dark:data-[state=checked]:text-[#a3b18a]"
            >
              {MILES_CURRENCY_LABELS[currency]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
