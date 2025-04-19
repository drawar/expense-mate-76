import { Currency, PaymentMethod } from "@/types";
import { BaseService } from "./core/BaseService";

/**
 * Service for handling all currency-related operations including
 * formatting, conversion, and currency information.
 */
export class CurrencyService extends BaseService {
  private static _instance: CurrencyService;

  /**
   * List of currencies that don't use decimal places
   */
  private static readonly NO_DECIMAL_CURRENCIES = ["JPY", "VND", "IDR", "TWD"];

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

  // Exchange rates cache with 24-hour expiration
  private exchangeRatesCache = this.createCache<Record<Currency, Record<Currency, number>>>(24 * 60 * 60 * 1000);

  private constructor() {
    super();
    this.initializeExchangeRates();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CurrencyService {
    if (!this._instance) {
      this._instance = new CurrencyService();
    }
    return this._instance;
  }

  /**
   * Initialize exchange rates with default values
   */
  private initializeExchangeRates(): void {
    this.exchangeRatesCache.set('default', CurrencyService.DEFAULT_EXCHANGE_RATES);
  }

  /**
   * Formats a currency amount with the appropriate symbol and formatting rules
   */
  public format(amount: number, currency: Currency): string {
    // Handle edge cases where currency might be undefined or invalid
    if (!currency || !Object.keys(CurrencyService.CURRENCY_SYMBOLS).includes(currency)) {
      console.warn(
        `Invalid currency provided: ${currency}, using USD as fallback`
      );
      currency = "USD" as Currency;
    }

    // Get decimal places based on currency type
    const decimalPlaces = CurrencyService.NO_DECIMAL_CURRENCIES.includes(currency) ? 0 : 2;

    // Format the number part with appropriate decimal places
    const formatter = new Intl.NumberFormat("en-US", {
      style: "decimal", // Use decimal style to avoid built-in currency symbols
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    // Get the correct currency symbol from our mapping
    const symbol = CurrencyService.CURRENCY_SYMBOLS[currency];

    // Return the formatted string with our custom symbol
    return `${symbol}${formatter.format(amount)}`;
  }

  /**
   * Converts an amount from one currency to another
   */
  public convert(
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

    // Get exchange rates from cache
    const rates = this.exchangeRatesCache.get('default');
    if (!rates) return amount; // Fallback to original amount if no rates found

    // Add validation for currency codes to prevent accessing undefined rates
    if (!rates[fromCurrency]) {
      console.error(`Invalid source currency: ${fromCurrency}`);
      return amount; // Return original amount if conversion not possible
    }

    if (!rates[fromCurrency][toCurrency]) {
      console.error(
        `Invalid target currency or exchange rate not available: ${fromCurrency} to ${toCurrency}`
      );
      return amount; // Return original amount if conversion not possible
    }

    // Now we can safely access the exchange rate
    return amount * rates[fromCurrency][toCurrency];
  }

  /**
   * Gets the symbol for a given currency
   */
  public getSymbol(currency: Currency): string {
    return CurrencyService.CURRENCY_SYMBOLS[currency] || currency;
  }

  /**
   * Gets the list of currency options for dropdown menus
   */
  public getCurrencyOptions(): { value: Currency; label: string }[] {
    return [...CurrencyService.CURRENCY_OPTIONS];
  }

  /**
   * Gets the exchange rate between two currencies
   */
  public getExchangeRate(fromCurrency: Currency, toCurrency: Currency): number {
    if (fromCurrency === toCurrency) return 1;

    // Get exchange rates from cache
    const rates = this.exchangeRatesCache.get('default');
    if (!rates) return 1; // Fallback to 1 if no rates found

    if (
      !rates[fromCurrency] ||
      !rates[fromCurrency][toCurrency]
    ) {
      console.error(
        `Exchange rate not available: ${fromCurrency} to ${toCurrency}`
      );
      return 1;
    }

    return rates[fromCurrency][toCurrency];
  }

  /**
   * Update exchange rates (e.g., from an external API)
   */
  public updateExchangeRates(rates: Record<Currency, Record<Currency, number>>): void {
    this.exchangeRatesCache.set('default', rates);
  }

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
}

// Export singleton instance
export const currencyService = CurrencyService.getInstance();

// Also export static formatting functions for convenience
export const formatCurrency = (amount: number, currency: Currency): string => {
  return currencyService.format(amount, currency);
};

export const convertCurrency = (amount: number, from: Currency, to: Currency, paymentMethod?: PaymentMethod): number => {
  return currencyService.convert(amount, from, to, paymentMethod);
};
