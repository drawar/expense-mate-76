// core/locale/LocaleService.ts
import { Currency } from "@/types";

const LOCALE_CACHE_KEY = "expense-mate-locale";
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface LocaleCache {
  country: string;
  currency: Currency;
  timestamp: number;
}

// Map country codes to currencies
const COUNTRY_CURRENCY_MAP: Record<string, Currency> = {
  // North America
  CA: "CAD",
  US: "USD",
  // Asia Pacific
  SG: "SGD",
  JP: "JPY",
  CN: "CNY",
  HK: "USD", // HKD not in our list, use USD
  TW: "TWD",
  KR: "USD", // KRW not in our list, use USD
  IN: "INR",
  AU: "AUD",
  NZ: "AUD", // NZD not in our list, use AUD
  MY: "MYR",
  TH: "THB",
  VN: "VND",
  ID: "IDR",
  PH: "USD", // PHP not in our list, use USD
  // Europe
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  PT: "EUR",
  GR: "EUR",
  FI: "EUR",
  // Default fallback
  DEFAULT: "CAD",
};

class LocaleServiceClass {
  private cache: LocaleCache | null = null;
  private detectPromise: Promise<LocaleCache> | null = null;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(LOCALE_CACHE_KEY);
      if (stored) {
        const parsed: LocaleCache = JSON.parse(stored);
        // Check if cache is still valid
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          this.cache = parsed;
        }
      }
    } catch (error) {
      console.warn("Failed to load locale cache:", error);
    }
  }

  private saveToStorage(data: LocaleCache): void {
    try {
      localStorage.setItem(LOCALE_CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save locale cache:", error);
    }
  }

  /**
   * Get the cached default currency synchronously
   * Returns CAD if no cache exists yet
   */
  getDefaultCurrency(): Currency {
    return this.cache?.currency || "CAD";
  }

  /**
   * Get the cached country code
   */
  getCountry(): string | null {
    return this.cache?.country || null;
  }

  /**
   * Check if locale has been detected
   */
  isDetected(): boolean {
    return this.cache !== null;
  }

  /**
   * Detect user's locale from IP address
   * Uses ip-api.com (free, no API key required, 45 requests/minute limit)
   */
  async detectLocale(): Promise<LocaleCache> {
    // Return cached result if valid AND it was a successful detection
    // (country !== "UNKNOWN" means it was successfully detected)
    if (this.cache && this.cache.country !== "UNKNOWN") {
      return this.cache;
    }

    // Avoid multiple concurrent requests
    if (this.detectPromise) {
      return this.detectPromise;
    }

    this.detectPromise = this.fetchLocale();
    const result = await this.detectPromise;
    this.detectPromise = null;
    return result;
  }

  private async fetchLocale(): Promise<LocaleCache> {
    try {
      // Using ipapi.co - free tier (1000 req/day), supports HTTPS
      // Returns: { country_code, currency, ... }
      const response = await fetch("https://ipapi.co/json/", {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const countryCode = data.country_code || "CA";
      const currency =
        COUNTRY_CURRENCY_MAP[countryCode] || COUNTRY_CURRENCY_MAP.DEFAULT;

      const localeData: LocaleCache = {
        country: countryCode,
        currency,
        timestamp: Date.now(),
      };

      this.cache = localeData;
      this.saveToStorage(localeData);

      console.log(`Locale detected: ${countryCode} → ${currency}`);
      return localeData;
    } catch (error) {
      console.warn("Failed to detect locale, using default:", error);

      // Return default on failure but DON'T cache it long-term
      // This allows retry on next app load
      const fallback: LocaleCache = {
        country: "UNKNOWN",
        currency: "CAD",
        // Use a timestamp from 6 days ago so it expires in 1 day
        // This allows retry sooner rather than waiting 7 days
        timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
      };

      // Only set in-memory cache, don't persist failed detection
      this.cache = fallback;
      return fallback;
    }
  }

  /**
   * Manually set the default currency (user override)
   */
  setDefaultCurrency(currency: Currency): void {
    const country = this.cache?.country || "MANUAL";
    const localeData: LocaleCache = {
      country,
      currency,
      timestamp: Date.now(),
    };
    this.cache = localeData;
    this.saveToStorage(localeData);
  }

  /**
   * Clear the cache (for testing or reset)
   */
  clearCache(): void {
    this.cache = null;
    localStorage.removeItem(LOCALE_CACHE_KEY);
  }
}

// Export singleton instance
export const LocaleService = new LocaleServiceClass();
