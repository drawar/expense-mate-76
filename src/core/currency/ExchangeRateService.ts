import { Currency } from "@/types";

/**
 * Exchange rate data structure from the API
 */
interface ExchangeRateData {
  date: string;
  [key: string]: number | string;
}

/**
 * Cache entry with timestamp
 */
interface CacheEntry {
  rates: Record<string, number>;
  timestamp: number;
}

/**
 * ExchangeRateService - Fetches live exchange rates from free API
 *
 * Uses fawazahmed0/exchange-api (GitHub) which is:
 * - Free with no rate limits
 * - No API key required
 * - Updated daily
 * - 200+ currencies supported
 *
 * Falls back to hardcoded rates if API is unavailable.
 *
 * @see https://github.com/fawazahmed0/exchange-api
 */
export class ExchangeRateService {
  private static instance: ExchangeRateService;

  // Cache for exchange rates (keyed by base currency)
  private rateCache: Map<string, CacheEntry> = new Map();

  // Cache TTL: 1 hour (rates are updated daily, so hourly refresh is plenty)
  private readonly CACHE_TTL = 60 * 60 * 1000;

  // Primary and fallback API URLs
  private readonly API_PRIMARY =
    "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";
  private readonly API_FALLBACK =
    "https://latest.currency-api.pages.dev/v1/currencies";

  // Supported currencies in our app
  private readonly SUPPORTED_CURRENCIES: Currency[] = [
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
    "KRW",
  ];

  /**
   * Default exchange rates - fallback when API is unavailable
   * These rates are approximate and may be outdated
   */
  private readonly DEFAULT_RATES: Record<string, Record<string, number>> = {
    usd: {
      usd: 1,
      eur: 0.93,
      gbp: 0.79,
      jpy: 151.77,
      aud: 1.53,
      cad: 1.37,
      cny: 7.26,
      inr: 83.42,
      twd: 32.27,
      sgd: 1.35,
      vnd: 25305,
      idr: 16158,
      thb: 36.17,
      myr: 4.72,
    },
  };

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): ExchangeRateService {
    if (!ExchangeRateService.instance) {
      ExchangeRateService.instance = new ExchangeRateService();
    }
    return ExchangeRateService.instance;
  }

  /**
   * Fetch exchange rates for a base currency
   * Uses primary API with fallback to secondary, then to hardcoded rates
   *
   * @param baseCurrency - Base currency code (e.g., "USD")
   * @returns Record of currency codes to exchange rates
   */
  public async getRates(
    baseCurrency: Currency
  ): Promise<Record<string, number>> {
    const baseLower = baseCurrency.toLowerCase();

    // Check cache first
    const cached = this.rateCache.get(baseLower);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.rates;
    }

    try {
      // Try primary API
      const rates = await this.fetchFromAPI(this.API_PRIMARY, baseLower);
      if (rates) {
        this.cacheRates(baseLower, rates);
        return rates;
      }
    } catch (error) {
      console.warn("Primary exchange rate API failed, trying fallback:", error);
    }

    try {
      // Try fallback API
      const rates = await this.fetchFromAPI(this.API_FALLBACK, baseLower);
      if (rates) {
        this.cacheRates(baseLower, rates);
        return rates;
      }
    } catch (error) {
      console.warn("Fallback exchange rate API failed:", error);
    }

    // Return default rates if all APIs fail
    console.warn(
      `Using default exchange rates for ${baseCurrency} - live rates unavailable`
    );
    return this.getDefaultRates(baseLower);
  }

  /**
   * Fetch rates from the API
   */
  private async fetchFromAPI(
    baseUrl: string,
    baseCurrency: string
  ): Promise<Record<string, number> | null> {
    const url = `${baseUrl}/${baseCurrency}.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data: ExchangeRateData = await response.json();

    // The API returns { date: "...", [currency]: { rates... } }
    // or { date: "...", rates: { ... } } depending on the currency
    const rates = (data[baseCurrency] || data) as Record<string, number>;

    if (!rates || typeof rates !== "object") {
      throw new Error("Invalid response format");
    }

    // Filter to only supported currencies and normalize to lowercase
    const filteredRates: Record<string, number> = {};
    for (const currency of this.SUPPORTED_CURRENCIES) {
      const currLower = currency.toLowerCase();
      if (rates[currLower] !== undefined) {
        filteredRates[currLower] = rates[currLower];
      }
    }

    return filteredRates;
  }

  /**
   * Cache the rates
   */
  private cacheRates(
    baseCurrency: string,
    rates: Record<string, number>
  ): void {
    this.rateCache.set(baseCurrency, {
      rates,
      timestamp: Date.now(),
    });
  }

  /**
   * Get default hardcoded rates
   */
  private getDefaultRates(baseCurrency: string): Record<string, number> {
    // If we have default rates for this currency, return them
    if (this.DEFAULT_RATES[baseCurrency]) {
      return this.DEFAULT_RATES[baseCurrency];
    }

    // Otherwise, try to derive rates from USD rates
    const usdRates = this.DEFAULT_RATES["usd"];
    if (usdRates && usdRates[baseCurrency]) {
      // Calculate rates relative to base currency
      const baseToUsd = 1 / usdRates[baseCurrency];
      const derivedRates: Record<string, number> = {};

      for (const [curr, usdRate] of Object.entries(usdRates)) {
        derivedRates[curr] = usdRate * baseToUsd;
      }

      return derivedRates;
    }

    // Fallback: return 1:1 rates (no conversion)
    const fallbackRates: Record<string, number> = {};
    for (const currency of this.SUPPORTED_CURRENCIES) {
      fallbackRates[currency.toLowerCase()] = 1;
    }
    return fallbackRates;
  }

  /**
   * Get the exchange rate between two currencies
   *
   * @param from - Source currency code
   * @param to - Target currency code
   * @returns Exchange rate (how many "to" units per 1 "from" unit)
   */
  public async getRate(from: Currency, to: Currency): Promise<number> {
    if (from === to) return 1;

    const rates = await this.getRates(from);
    const toLower = to.toLowerCase();

    if (rates[toLower] !== undefined) {
      return rates[toLower];
    }

    // Fallback: try to calculate via USD
    console.warn(
      `Direct rate not available for ${from}->${to}, calculating via USD`
    );
    const fromRates = await this.getRates("USD" as Currency);
    const fromLower = from.toLowerCase();

    if (fromRates[fromLower] && fromRates[toLower]) {
      return fromRates[toLower] / fromRates[fromLower];
    }

    console.error(`Unable to calculate exchange rate: ${from} -> ${to}`);
    return 1;
  }

  /**
   * Convert an amount between currencies
   *
   * @param amount - Amount to convert
   * @param from - Source currency code
   * @param to - Target currency code
   * @returns Converted amount
   */
  public async convert(
    amount: number,
    from: Currency,
    to: Currency
  ): Promise<number> {
    const rate = await this.getRate(from, to);
    return amount * rate;
  }

  /**
   * Clear the rate cache (useful for testing or manual refresh)
   */
  public clearCache(): void {
    this.rateCache.clear();
  }

  /**
   * Check if rates are cached and fresh for a currency
   */
  public isCached(baseCurrency: Currency): boolean {
    const cached = this.rateCache.get(baseCurrency.toLowerCase());
    return (
      cached !== undefined && Date.now() - cached.timestamp < this.CACHE_TTL
    );
  }

  /**
   * Get the cache age in milliseconds for a currency
   * Returns -1 if not cached
   */
  public getCacheAge(baseCurrency: Currency): number {
    const cached = this.rateCache.get(baseCurrency.toLowerCase());
    if (!cached) return -1;
    return Date.now() - cached.timestamp;
  }
}

export default ExchangeRateService;
