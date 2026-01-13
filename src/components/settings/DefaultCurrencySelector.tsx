import { useState, useEffect } from "react";
import { Currency } from "@/types";
import { CurrencyService } from "@/core/currency/CurrencyService";
import { LocaleService } from "@/core/locale";
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
import { Globe, Loader2 } from "lucide-react";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load saved preference from database
    const loadPreference = async () => {
      setIsLoading(true);
      try {
        const savedCurrency = await UserPreferencesService.getDefaultCurrency();
        if (savedCurrency) {
          setSelectedCurrency(savedCurrency);
          // Also update localStorage for quick access
          LocaleService.setDefaultCurrency(savedCurrency);
        } else {
          // No saved preference, use locale detection
          setSelectedCurrency(CurrencyService.getDefaultCurrency());
        }
        setDetectedCountry(LocaleService.getCountry());
      } catch (error) {
        console.error("Failed to load currency preference:", error);
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

    // Save to localStorage for quick access
    LocaleService.setDefaultCurrency(value);

    // Save to database for persistence
    const saved = await UserPreferencesService.setDefaultCurrency(value);

    setIsSaving(false);

    toast({
      title: "Default currency updated",
      description: saved
        ? `New expenses will default to ${value}`
        : `Saved locally. Sign in to sync across devices.`,
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
              disabled={isLoading || isSaving}
            >
              <SelectTrigger className="w-[200px]">
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
                  <SelectValue placeholder="Select currency" />
                )}
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
