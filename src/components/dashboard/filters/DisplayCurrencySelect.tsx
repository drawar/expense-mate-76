// components/dashboard/filters/DisplayCurrencySelect.tsx
import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyService } from "@/core/currency";
import { Currency } from "@/types";

// Currency to flag emoji mapping
const currencyFlags: Record<string, string> = {
  CAD: "🇨🇦",
  USD: "🇺🇸",
  SGD: "🇸🇬",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  AUD: "🇦🇺",
  CNY: "🇨🇳",
  INR: "🇮🇳",
  TWD: "🇹🇼",
  VND: "🇻🇳",
  IDR: "🇮🇩",
  THB: "🇹🇭",
  MYR: "🇲🇾",
};

export interface DisplayCurrencySelectProps {
  value: Currency;
  onChange: (currency: Currency) => void;
  className?: string;
}

/**
 * Component for selecting display currency
 */
const DisplayCurrencySelect: React.FC<DisplayCurrencySelectProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const currencyOptions = CurrencyService.getCurrencyOptions();

  return (
    <Select
      value={value}
      onValueChange={(value: string) => onChange(value as Currency)}
      defaultValue="CAD"
    >
      <SelectTrigger
        className={`w-[100px] h-8 text-sm bg-transparent border-none ${className}`}
      >
        <SelectValue>
          <span className="flex items-center gap-1.5">
            <span>{currencyFlags[value] || "💰"}</span>
            <span>{value}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {currencyOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              <span>{currencyFlags[option.value] || "💰"}</span>
              <span>{option.value}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default React.memo(DisplayCurrencySelect);
