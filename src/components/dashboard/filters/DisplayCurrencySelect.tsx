// components/dashboard/filters/DisplayCurrencySelect.tsx
import React from "react";
import "flag-icons/css/flag-icons.min.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyService } from "@/core/currency";
import { Currency } from "@/types";
import { UI_ICONS } from "@/utils/constants/icons";

// Currency to ISO 3166-1-alpha-2 country code mapping (lowercase)
const currencyToCountry: Record<string, string> = {
  CAD: "ca",
  USD: "us",
  SGD: "sg",
  EUR: "eu",
  GBP: "gb",
  JPY: "jp",
  AUD: "au",
  CNY: "cn",
  INR: "in",
  TWD: "tw",
  VND: "vn",
  IDR: "id",
  THB: "th",
  MYR: "my",
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
    <div className={className}>
      <Select
        value={value}
        onValueChange={(value: string) => onChange(value as Currency)}
      >
        <SelectTrigger className="w-full h-9 text-sm bg-transparent border-none">
          <SelectValue>
            <span className="flex items-center gap-1.5">
              {currencyToCountry[value] ? (
                <span className={`fi fi-${currencyToCountry[value]} text-lg`} />
              ) : (
                <UI_ICONS.money size={18} />
              )}
              <span>{value}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {currencyOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                {currencyToCountry[option.value] ? (
                  <span
                    className={`fi fi-${currencyToCountry[option.value]} text-lg`}
                  />
                ) : (
                  <UI_ICONS.money size={18} />
                )}
                <span>{option.value}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default React.memo(DisplayCurrencySelect);
