import { Currency, PaymentMethod } from "@/types";
import { ExchangeRateService } from "./ExchangeRateService";
import { LocaleService } from "@/core/locale";

/**
 * Centralized Currency Service for handling all currency-related operations
 * including formatting, conversion, and currency information.
 *
 * Supports live exchange rates via ExchangeRateService with fallback to
 * hardcoded defaults when API is unavailable.
 */
export class CurrencyService {
  /**
   * List of currencies that don't use decimal places
   */
  private static readonly NO_DECIMAL_CURRENCIES = ["JPY", "VND", "IDR", "TWD"];

  /**
   * Live exchange rates cache (populated by refreshRates)
   * Key format: "FROM_TO" (e.g., "USD_EUR")
   */
  private static liveRateCache: Map<string, number> = new Map();

  /**
   * Timestamp of last rate refresh
   */
  private static lastRefreshTime: number = 0;

  /**
   * Cache TTL for live rates (1 hour)
   */
  private static readonly LIVE_RATE_TTL = 60 * 60 * 1000;

  /**
   * Currency symbols mapping
   */
  private static readonly CURRENCY_SYMBOLS: Record<Currency, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    AUD: "A$",
    CAD: "C$",
    CNY: "¥",
    INR: "₹",
    TWD: "NT$",
    SGD: "S$",
    VND: "₫",
    IDR: "Rp",
    THB: "฿",
    MYR: "RM",
  };

  /**
   * Default exchange rates - in a real app, these would come from an API
   */
  private static readonly DEFAULT_EXCHANGE_RATES: Record<
    Currency,
    Record<Currency, number>
  > = {
    USD: {
      USD: 1,
      EUR: 0.93,
      GBP: 0.79,
      JPY: 151.77,
      AUD: 1.53,
      CAD: 1.37,
      CNY: 7.26,
      INR: 83.42,
      TWD: 32.27,
      SGD: 1.35,
      VND: 25305,
      IDR: 16158,
      THB: 36.17,
      MYR: 4.72,
    },
    EUR: {
      USD: 1.08,
      EUR: 1,
      GBP: 0.85,
      JPY: 163.59,
      AUD: 1.65,
      CAD: 1.47,
      CNY: 7.83,
      INR: 89.93,
      TWD: 34.78,
      SGD: 1.45,
      VND: 27276,
      IDR: 17416,
      THB: 38.99,
      MYR: 5.09,
    },
    GBP: {
      USD: 1.27,
      EUR: 1.18,
      GBP: 1,
      JPY: 192.96,
      AUD: 1.94,
      CAD: 1.74,
      CNY: 9.24,
      INR: 106.06,
      TWD: 41.04,
      SGD: 1.71,
      VND: 32179,
      IDR: 20548,
      THB: 46.0,
      MYR: 6.0,
    },
    JPY: {
      USD: 0.0066,
      EUR: 0.0061,
      GBP: 0.0052,
      JPY: 1,
      AUD: 0.01,
      CAD: 0.009,
      CNY: 0.048,
      INR: 0.55,
      TWD: 0.21,
      SGD: 0.0089,
      VND: 166.73,
      IDR: 106.43,
      THB: 0.24,
      MYR: 0.031,
    },
    AUD: {
      USD: 0.65,
      EUR: 0.61,
      GBP: 0.52,
      JPY: 99.06,
      AUD: 1,
      CAD: 0.89,
      CNY: 4.74,
      INR: 54.47,
      TWD: 21.08,
      SGD: 0.88,
      VND: 16524,
      IDR: 10551,
      THB: 23.61,
      MYR: 3.08,
    },
    CAD: {
      USD: 0.73,
      EUR: 0.68,
      GBP: 0.58,
      JPY: 111.31,
      AUD: 1.12,
      CAD: 1,
      CNY: 5.32,
      INR: 61.2,
      TWD: 23.68,
      SGD: 0.99,
      VND: 18564,
      IDR: 11854,
      THB: 26.53,
      MYR: 3.46,
    },
    CNY: {
      USD: 0.14,
      EUR: 0.13,
      GBP: 0.11,
      JPY: 20.9,
      AUD: 0.21,
      CAD: 0.19,
      CNY: 1,
      INR: 11.49,
      TWD: 4.45,
      SGD: 0.19,
      VND: 3486,
      IDR: 2225,
      THB: 4.98,
      MYR: 0.65,
    },
    INR: {
      USD: 0.012,
      EUR: 0.011,
      GBP: 0.0094,
      JPY: 1.82,
      AUD: 0.018,
      CAD: 0.016,
      CNY: 0.087,
      INR: 1,
      TWD: 0.39,
      SGD: 0.016,
      VND: 303.33,
      IDR: 193.69,
      THB: 0.43,
      MYR: 0.057,
    },
    TWD: {
      USD: 0.031,
      EUR: 0.029,
      GBP: 0.024,
      JPY: 4.71,
      AUD: 0.047,
      CAD: 0.042,
      CNY: 0.22,
      INR: 2.59,
      TWD: 1,
      SGD: 0.042,
      VND: 784.16,
      IDR: 500.71,
      THB: 1.12,
      MYR: 0.15,
    },
    SGD: {
      USD: 0.74,
      EUR: 0.69,
      GBP: 0.58,
      JPY: 112.8,
      AUD: 1.14,
      CAD: 1.01,
      CNY: 5.39,
      INR: 61.97,
      TWD: 23.98,
      SGD: 1,
      VND: 18796,
      IDR: 12005,
      THB: 26.88,
      MYR: 3.51,
    },
    VND: {
      USD: 0.00004,
      EUR: 0.000037,
      GBP: 0.000031,
      JPY: 0.006,
      AUD: 0.000061,
      CAD: 0.000054,
      CNY: 0.00029,
      INR: 0.0033,
      TWD: 0.0013,
      SGD: 0.000053,
      VND: 1,
      IDR: 0.64,
      THB: 0.0014,
      MYR: 0.00019,
    },
    IDR: {
      USD: 0.000062,
      EUR: 0.000057,
      GBP: 0.000049,
      JPY: 0.0094,
      AUD: 0.000095,
      CAD: 0.000084,
      CNY: 0.00045,
      INR: 0.0052,
      TWD: 0.002,
      SGD: 0.000083,
      VND: 1.57,
      IDR: 1,
      THB: 0.0022,
      MYR: 0.00029,
    },
    THB: {
      USD: 0.028,
      EUR: 0.026,
      GBP: 0.022,
      JPY: 4.2,
      AUD: 0.042,
      CAD: 0.038,
      CNY: 0.2,
      INR: 2.31,
      TWD: 0.89,
      SGD: 0.037,
      VND: 699.81,
      IDR: 446.86,
      THB: 1,
      MYR: 0.13,
    },
    MYR: {
      USD: 0.21,
      EUR: 0.2,
      GBP: 0.17,
      JPY: 32.15,
      AUD: 0.32,
      CAD: 0.29,
      CNY: 1.54,
      INR: 17.67,
      TWD: 6.84,
      SGD: 0.29,
      VND: 5360,
      IDR: 3423,
      THB: 7.66,
      MYR: 1,
    },
  };

  /**
   * Currency options for dropdown selects
   */
  private static readonly CURRENCY_OPTIONS: {
    value: Currency;
    label: string;
  }[] = [
    { value: "USD", label: "USD - US Dollar ($)" },
    { value: "EUR", label: "EUR - Euro (€)" },
    { value: "GBP", label: "GBP - British Pound (£)" },
    { value: "JPY", label: "JPY - Japanese Yen (¥)" },
    { value: "AUD", label: "AUD - Australian Dollar (A$)" },
    { value: "CAD", label: "CAD - Canadian Dollar (C$)" },
    { value: "CNY", label: "CNY - Chinese Yuan (¥)" },
    { value: "INR", label: "INR - Indian Rupee (₹)" },
    { value: "TWD", label: "TWD - New Taiwan Dollar (NT$)" },
    { value: "SGD", label: "SGD - Singapore Dollar (S$)" },
    { value: "VND", label: "VND - Vietnamese Dong (₫)" },
    { value: "IDR", label: "IDR - Indonesian Rupiah (Rp)" },
    { value: "THB", label: "THB - Thai Baht (฿)" },
    { value: "MYR", label: "MYR - Malaysian Ringgit (RM)" },
  ];

  /**
   * Formats a currency amount with the appropriate symbol and formatting rules
   *
   * @param amount - Amount to format
   * @param currency - Currency code
   * @returns Formatted currency string (e.g., "$123.45")
   */
  public static format(amount: number, currency: Currency): string {
    // Handle edge cases where currency might be undefined or invalid
    if (!currency || !Object.keys(this.CURRENCY_SYMBOLS).includes(currency)) {
      console.warn(
        `Invalid currency provided: ${currency}, using USD as fallback`
      );
      currency = "USD" as Currency;
    }

    // Get decimal places based on currency type
    const decimalPlaces = this.NO_DECIMAL_CURRENCIES.includes(currency) ? 0 : 2;

    // Format the number part with appropriate decimal places
    const formatter = new Intl.NumberFormat("en-US", {
      style: "decimal", // Use decimal style to avoid built-in currency symbols
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    // Get the correct currency symbol from our mapping
    const symbol = this.CURRENCY_SYMBOLS[currency];

    // Return the formatted string with our custom symbol
    return `${symbol}${formatter.format(amount)}`;
  }

  /**
   * Converts an amount from one currency to another
   *
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   * @param paymentMethod - Optional payment method with custom conversion rates
   * @returns Converted amount in the target currency
   */
  public static convert(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency,
    paymentMethod?: PaymentMethod
  ): number {
    if (fromCurrency === toCurrency) return amount;

    // Check if payment method exists before trying to access its properties
    if (
      paymentMethod?.conversionRate &&
      paymentMethod.conversionRate[toCurrency] !== undefined
    ) {
      return amount * paymentMethod.conversionRate[toCurrency];
    }

    // Add validation for currency codes to prevent accessing undefined rates
    if (!this.DEFAULT_EXCHANGE_RATES[fromCurrency]) {
      console.error(`Invalid source currency: ${fromCurrency}`);
      return amount; // Return original amount if conversion not possible
    }

    if (!this.DEFAULT_EXCHANGE_RATES[fromCurrency][toCurrency]) {
      console.error(
        `Invalid target currency or exchange rate not available: ${fromCurrency} to ${toCurrency}`
      );
      return amount; // Return original amount if conversion not possible
    }

    // Now we can safely access the exchange rate
    return amount * this.DEFAULT_EXCHANGE_RATES[fromCurrency][toCurrency];
  }

  /**
   * Gets the symbol for a given currency
   *
   * @param currency - Currency code
   * @returns Currency symbol (e.g., "$" for USD)
   */
  public static getSymbol(currency: Currency): string {
    return this.CURRENCY_SYMBOLS[currency] || currency;
  }

  /**
   * Gets the default currency based on user's locale
   * Uses IP geolocation with localStorage caching
   *
   * @returns Default currency code
   */
  public static getDefaultCurrency(): Currency {
    return LocaleService.getDefaultCurrency();
  }

  /**
   * Detect and set the default currency based on IP location
   * Call this on app initialization
   */
  public static async detectDefaultCurrency(): Promise<Currency> {
    const locale = await LocaleService.detectLocale();
    return locale.currency;
  }

  /**
   * Gets the list of currency options for dropdown menus
   * The detected default currency is placed first in the list
   *
   * @returns Array of currency options with value and label
   */
  public static getCurrencyOptions(): { value: Currency; label: string }[] {
    const defaultCurrency = this.getDefaultCurrency();
    const options = [...this.CURRENCY_OPTIONS];

    // Move default currency to the top of the list
    const defaultIndex = options.findIndex((o) => o.value === defaultCurrency);
    if (defaultIndex > 0) {
      const [defaultOption] = options.splice(defaultIndex, 1);
      options.unshift(defaultOption);
    }

    return options;
  }

  /**
   * Gets the exchange rate between two currencies.
   * Checks live rates first, then falls back to defaults.
   *
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   * @returns Exchange rate or 1 if conversion not possible
   */
  public static getExchangeRate(
    fromCurrency: Currency,
    toCurrency: Currency
  ): number {
    if (fromCurrency === toCurrency) return 1;

    // Check live rate cache first
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const liveRate = this.liveRateCache.get(cacheKey);
    if (liveRate !== undefined && this.isLiveRateFresh()) {
      return liveRate;
    }

    // Fall back to default rates
    if (
      !this.DEFAULT_EXCHANGE_RATES[fromCurrency] ||
      !this.DEFAULT_EXCHANGE_RATES[fromCurrency][toCurrency]
    ) {
      console.error(
        `Exchange rate not available: ${fromCurrency} to ${toCurrency}`
      );
      return 1;
    }

    return this.DEFAULT_EXCHANGE_RATES[fromCurrency][toCurrency];
  }

  /**
   * Check if live rate cache is fresh
   */
  private static isLiveRateFresh(): boolean {
    return Date.now() - this.lastRefreshTime < this.LIVE_RATE_TTL;
  }

  /**
   * Refresh exchange rates from live API.
   * Call this on app startup or when rates might be stale.
   *
   * @param baseCurrency - Base currency to fetch rates for (default: USD)
   * @returns Promise that resolves when rates are refreshed
   */
  public static async refreshRates(
    baseCurrency: Currency = "USD"
  ): Promise<void> {
    try {
      const exchangeService = ExchangeRateService.getInstance();
      const rates = await exchangeService.getRates(baseCurrency);

      // Clear old cache
      this.liveRateCache.clear();

      // Populate cache with rates from base currency
      const baseLower = baseCurrency.toLowerCase();
      for (const [toCurrency, rate] of Object.entries(rates)) {
        const toUpper = toCurrency.toUpperCase() as Currency;
        this.liveRateCache.set(`${baseCurrency}_${toUpper}`, rate);

        // Also calculate reverse rate
        if (rate !== 0) {
          this.liveRateCache.set(`${toUpper}_${baseCurrency}`, 1 / rate);
        }
      }

      // Calculate cross rates (e.g., EUR -> GBP via USD)
      const supportedCurrencies: Currency[] = [
        "USD",
        "EUR",
        "GBP",
        "JPY",
        "AUD",
        "CAD",
        "CNY",
        "INR",
        "TWD",
        "SGD",
        "VND",
        "IDR",
        "THB",
        "MYR",
      ];

      for (const from of supportedCurrencies) {
        for (const to of supportedCurrencies) {
          if (from === to) continue;

          const cacheKey = `${from}_${to}`;
          if (this.liveRateCache.has(cacheKey)) continue;

          // Calculate via base currency
          const fromToBase = this.liveRateCache.get(`${from}_${baseCurrency}`);
          const baseToTo = this.liveRateCache.get(`${baseCurrency}_${to}`);

          if (fromToBase !== undefined && baseToTo !== undefined) {
            this.liveRateCache.set(cacheKey, fromToBase * baseToTo);
          }
        }
      }

      this.lastRefreshTime = Date.now();
      console.log(
        `Exchange rates refreshed: ${this.liveRateCache.size} rates cached`
      );
    } catch (error) {
      console.error("Failed to refresh exchange rates:", error);
      // Live rates will fall back to defaults
    }
  }

  /**
   * Check if live rates are available and fresh
   */
  public static hasLiveRates(): boolean {
    return this.liveRateCache.size > 0 && this.isLiveRateFresh();
  }

  /**
   * Get the timestamp of the last rate refresh
   */
  public static getLastRefreshTime(): number {
    return this.lastRefreshTime;
  }

  /**
   * Convert amount using live rates (async)
   * Use this when you need guaranteed fresh rates
   *
   * @param amount - Amount to convert
   * @param fromCurrency - Source currency code
   * @param toCurrency - Target currency code
   * @returns Converted amount
   */
  public static async convertAsync(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const exchangeService = ExchangeRateService.getInstance();
    const rate = await exchangeService.getRate(fromCurrency, toCurrency);
    return amount * rate;
  }
}
