import { useState, useEffect } from "react";
import { Currency } from "@/types";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { LocaleService } from "@/core/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

/**
 * DefaultCurrencySelector component for setting the default currency
 * used throughout the application for new expenses, income, etc.
 */
export function DefaultCurrencySelector() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    CurrencyService.getDefaultCurrency()
  );
  const [detectedCountry, setDetectedCountry] = useState<string | null>(
    LocaleService.getCountry()
  );

  useEffect(() => {
    // Update state if locale detection completes after mount
    setSelectedCurrency(CurrencyService.getDefaultCurrency());
    setDetectedCountry(LocaleService.getCountry());
  }, []);

  const handleCurrencyChange = (value: Currency) => {
    setSelectedCurrency(value);
    LocaleService.setDefaultCurrency(value);
    toast({
      title: "Default currency updated",
      description: `New expenses will default to ${value}`,
    });
  };

  const currencyOptions = CurrencyService.getCurrencyOptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Default Currency
        </CardTitle>
        <CardDescription>
          Set the default currency for new expenses and income.
          {detectedCountry &&
            detectedCountry !== "UNKNOWN" &&
            detectedCountry !== "MANUAL" && (
              <span className="block mt-1 text-xs">
                Auto-detected from your location: {detectedCountry}
              </span>
            )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium min-w-[120px]">
              Currency
            </label>
            <Select
              value={selectedCurrency}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            This currency will be pre-selected when adding new expenses or
            income. You can always change it for individual transactions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
