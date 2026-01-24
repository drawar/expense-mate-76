import { useState, useEffect } from "react";
import "flag-icons/css/flag-icons.min.css";
import { Currency } from "@/types";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { UserPreferencesService } from "@/core/preferences";
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
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

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
  QAR: "qa",
  KRW: "kr",
};

/**
 * DisplayCurrencySelector component for setting the currency
 * used to display dashboard data (spending, budgets, etc.)
 */
export function DisplayCurrencySelector() {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    CurrencyService.getDefaultCurrency()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load saved preference from database
    const loadPreference = async () => {
      setIsLoading(true);
      try {
        const savedCurrency = await UserPreferencesService.getDisplayCurrency();
        if (savedCurrency) {
          setSelectedCurrency(savedCurrency);
        } else {
          // Fall back to default currency
          const defaultCurrency =
            await UserPreferencesService.getDefaultCurrency();
          setSelectedCurrency(
            defaultCurrency || CurrencyService.getDefaultCurrency()
          );
        }
      } catch (error) {
        console.error("Failed to load display currency preference:", error);
        setSelectedCurrency(CurrencyService.getDefaultCurrency());
      } finally {
        setIsLoading(false);
      }
    };
    loadPreference();
  }, []);

  const handleCurrencyChange = async (value: Currency) => {
    setSelectedCurrency(value);
    setIsSaving(true);

    // Save to database for persistence
    const saved = await UserPreferencesService.setDisplayCurrency(value);

    setIsSaving(false);

    toast({
      title: "Display currency updated",
      description: saved
        ? `Dashboard will now show amounts in ${value}`
        : `Saved locally. Sign in to sync across devices.`,
    });

    // Reload page to apply the new currency to dashboard
    window.location.reload();
  };

  const currencyOptions = CurrencyService.getCurrencyOptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Display Currency
        </CardTitle>
        <CardDescription>
          Set the currency for viewing your dashboard, spending reports, and
          budgets.
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
              disabled={isLoading || isSaving}
            >
              <SelectTrigger className="flex-1">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      {currencyToCountry[selectedCurrency] ? (
                        <span
                          className={`fi fi-${currencyToCountry[selectedCurrency]} text-lg`}
                        />
                      ) : null}
                      <span>{selectedCurrency}</span>
                    </span>
                  </SelectValue>
                )}
              </SelectTrigger>
              <SelectContent>
                {currencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      {currencyToCountry[option.value] ? (
                        <span
                          className={`fi fi-${currencyToCountry[option.value]} text-lg`}
                        />
                      ) : null}
                      <span>{option.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            All amounts on your dashboard will be converted to this currency
            using the latest exchange rates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
