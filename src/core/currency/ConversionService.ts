import { supabase } from "@/integrations/supabase/client";
import {
  RewardCurrency,
  MilesCurrencyType,
  DbRewardCurrency,
  DbMilesCurrency,
  toRewardCurrency,
  toMilesCurrency,
} from "./types";

/**
 * Miles currency options for conversion (legacy - kept for backward compatibility)
 */
export type MilesCurrency =
  | "KrisFlyer"
  | "AsiaMiles"
  | "Avios"
  | "FlyingBlue"
  | "Aeroplan";

/**
 * Conversion rate matrix structure
 */
export interface ConversionRateMatrix {
  [rewardCurrency: string]: {
    [milesCurrency in MilesCurrency]?: number;
  };
}

/**
 * Database model for conversion rates
 */
export interface DbConversionRate {
  id: string;
  reward_currency: string;
  miles_currency: string;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

/**
 * ConversionService manages currency conversion logic and rate retrieval
 * for converting reward points to miles currencies.
 */
export class ConversionService {
  private static instance: ConversionService;
  private conversionRateCache: Map<string, number> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  /**
   * Get singleton instance of ConversionService
   */
  public static getInstance(): ConversionService {
    if (!ConversionService.instance) {
      ConversionService.instance = new ConversionService();
    }
    return ConversionService.instance;
  }

  /**
   * Generate cache key for a conversion rate
   */
  private getCacheKey(
    rewardCurrency: string,
    milesCurrency: MilesCurrency
  ): string {
    return `${rewardCurrency}:${milesCurrency}`;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }

  /**
   * Clear the conversion rate cache
   */
  private clearCache(): void {
    this.conversionRateCache.clear();
    this.cacheTimestamp = 0;
  }

  /**
   * Convert reward points to miles currency
   *
   * @param points - Number of reward points to convert
   * @param rewardCurrency - Source reward currency (e.g., "Citi ThankYou Points")
   * @param milesCurrency - Target miles currency (e.g., "KrisFlyer")
   * @returns Object containing converted miles and the rate used, or null values if no rate exists
   */
  public async convertToMiles(
    points: number,
    rewardCurrency: string,
    milesCurrency: MilesCurrency
  ): Promise<{ miles: number | null; rate: number | null }> {
    const rate = await this.getConversionRate(rewardCurrency, milesCurrency);

    if (rate === null) {
      return { miles: null, rate: null };
    }

    const miles = points * rate;
    return { miles, rate };
  }

  /**
   * Get conversion rate for a specific reward currency to miles currency pair
   *
   * @param rewardCurrency - Source reward currency
   * @param milesCurrency - Target miles currency
   * @returns Conversion rate or null if not found
   */
  public async getConversionRate(
    rewardCurrency: string,
    milesCurrency: MilesCurrency
  ): Promise<number | null> {
    console.log(
      `[ConversionService] getConversionRate called: rewardCurrency="${rewardCurrency}", milesCurrency="${milesCurrency}"`
    );
    const cacheKey = this.getCacheKey(rewardCurrency, milesCurrency);

    // Check cache first
    if (this.isCacheValid() && this.conversionRateCache.has(cacheKey)) {
      const cached = this.conversionRateCache.get(cacheKey) || null;
      console.log(`[ConversionService] Cache hit: ${cached}`);
      return cached;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("conversion_rates")
        .select("conversion_rate")
        .eq("reward_currency", rewardCurrency)
        .eq("miles_currency", milesCurrency)
        .maybeSingle();

      console.log(`[ConversionService] Query result:`, { data, error });

      if (error) {
        console.error("Error fetching conversion rate:", error);
        return null;
      }

      if (!data) {
        console.log(
          `[ConversionService] No data found for "${rewardCurrency}" -> "${milesCurrency}"`
        );
        // Cache the null result to avoid repeated queries
        this.conversionRateCache.set(cacheKey, 0);
        return null;
      }

      // Cache the result
      const conversionRate = (data as DbConversionRate).conversion_rate;
      this.conversionRateCache.set(cacheKey, conversionRate);
      this.cacheTimestamp = Date.now();

      return conversionRate;
    } catch (error) {
      console.error("Error in getConversionRate:", error);
      return null;
    }
  }

  /**
   * Get all conversion rates for a specific reward currency
   *
   * @param rewardCurrency - Source reward currency
   * @returns Partial record of miles currencies to conversion rates
   */
  public async getConversionRatesForRewardCurrency(
    rewardCurrency: string
  ): Promise<Partial<Record<MilesCurrency, number>>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("conversion_rates")
        .select("miles_currency, conversion_rate")
        .eq("reward_currency", rewardCurrency);

      if (error) {
        console.error(
          "Error fetching conversion rates for reward currency:",
          error
        );
        return {};
      }

      if (!data || data.length === 0) {
        return {};
      }

      // Build the result object and update cache
      const result: Partial<Record<MilesCurrency, number>> = {};
      data.forEach((row: DbConversionRate) => {
        const milesCurrency = row.miles_currency as MilesCurrency;
        result[milesCurrency] = row.conversion_rate;

        // Update cache
        const cacheKey = this.getCacheKey(rewardCurrency, milesCurrency);
        this.conversionRateCache.set(cacheKey, row.conversion_rate);
      });

      this.cacheTimestamp = Date.now();
      return result;
    } catch (error) {
      console.error("Error in getConversionRatesForRewardCurrency:", error);
      return {};
    }
  }

  /**
   * Get all conversion rates (for management UI)
   *
   * @returns Complete conversion rate matrix
   */
  public async getAllConversionRates(): Promise<ConversionRateMatrix> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("conversion_rates")
        .select("reward_currency, miles_currency, conversion_rate");

      if (error) {
        console.error("Error fetching all conversion rates:", error);
        return {};
      }

      if (!data || data.length === 0) {
        return {};
      }

      // Build the matrix and update cache
      const matrix: ConversionRateMatrix = {};
      data.forEach((row: DbConversionRate) => {
        if (!matrix[row.reward_currency]) {
          matrix[row.reward_currency] = {};
        }
        const milesCurrency = row.miles_currency as MilesCurrency;
        matrix[row.reward_currency][milesCurrency] = row.conversion_rate;

        // Update cache
        const cacheKey = this.getCacheKey(row.reward_currency, milesCurrency);
        this.conversionRateCache.set(cacheKey, row.conversion_rate);
      });

      this.cacheTimestamp = Date.now();
      return matrix;
    } catch (error) {
      console.error("Error in getAllConversionRates:", error);
      return {};
    }
  }

  /**
   * Update a conversion rate
   *
   * @param rewardCurrency - Source reward currency
   * @param milesCurrency - Target miles currency
   * @param rate - New conversion rate (must be positive)
   * @throws Error if rate is not positive
   */
  public async updateConversionRate(
    rewardCurrency: string,
    milesCurrency: MilesCurrency,
    rate: number
  ): Promise<void> {
    // Validate rate is positive
    if (rate <= 0) {
      throw new Error("Conversion rate must be a positive number");
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("conversion_rates").upsert(
        {
          reward_currency: rewardCurrency,
          miles_currency: milesCurrency,
          conversion_rate: rate,
        },
        {
          onConflict: "reward_currency,miles_currency",
        }
      );

      if (error) {
        console.error("Error updating conversion rate:", error);
        throw new Error(`Failed to update conversion rate: ${error.message}`);
      }

      // Update cache
      const cacheKey = this.getCacheKey(rewardCurrency, milesCurrency);
      this.conversionRateCache.set(cacheKey, rate);
      this.cacheTimestamp = Date.now();
    } catch (error) {
      console.error("Error in updateConversionRate:", error);
      throw error;
    }
  }

  /**
   * Batch update conversion rates
   *
   * @param updates - Array of conversion rate updates
   * @throws Error if any rate is not positive
   */
  public async batchUpdateConversionRates(
    updates: Array<{
      rewardCurrency: string;
      milesCurrency: MilesCurrency;
      rate: number;
    }>
  ): Promise<void> {
    // Validate all rates are positive
    for (const update of updates) {
      if (update.rate <= 0) {
        throw new Error(
          `Conversion rate must be a positive number: ${update.rewardCurrency} -> ${update.milesCurrency}`
        );
      }
    }

    try {
      const upsertData = updates.map((update) => ({
        reward_currency: update.rewardCurrency,
        miles_currency: update.milesCurrency,
        conversion_rate: update.rate,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("conversion_rates")
        .upsert(upsertData, {
          onConflict: "reward_currency,miles_currency",
        });

      if (error) {
        console.error("Error batch updating conversion rates:", error);
        throw new Error(
          `Failed to batch update conversion rates: ${error.message}`
        );
      }

      // Clear cache to force refresh on next read
      this.clearCache();
    } catch (error) {
      console.error("Error in batchUpdateConversionRates:", error);
      throw error;
    }
  }

  /**
   * Delete all conversion rates for a specific reward currency
   *
   * @param rewardCurrency - The reward currency to delete all rates for
   */
  public async deleteRewardCurrency(rewardCurrency: string): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("conversion_rates")
        .delete()
        .eq("reward_currency", rewardCurrency);

      if (error) {
        console.error("Error deleting reward currency:", error);
        throw new Error(`Failed to delete reward currency: ${error.message}`);
      }

      // Clear cache
      this.clearCache();
    } catch (error) {
      console.error("Error in deleteRewardCurrency:", error);
      throw error;
    }
  }

  /**
   * Delete a specific conversion rate
   *
   * @param rewardCurrency - Source reward currency
   * @param milesCurrency - Target miles currency
   */
  public async deleteConversionRate(
    rewardCurrency: string,
    milesCurrency: MilesCurrency
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("conversion_rates")
        .delete()
        .eq("reward_currency", rewardCurrency)
        .eq("miles_currency", milesCurrency);

      if (error) {
        console.error("Error deleting conversion rate:", error);
        throw new Error(`Failed to delete conversion rate: ${error.message}`);
      }

      // Update cache
      const cacheKey = this.getCacheKey(rewardCurrency, milesCurrency);
      this.conversionRateCache.delete(cacheKey);
    } catch (error) {
      console.error("Error in deleteConversionRate:", error);
      throw error;
    }
  }

  /**
   * Get all available miles currencies from the database (legacy)
   *
   * @returns Array of unique miles currency names
   */
  public async getAvailableMilesCurrencies(): Promise<string[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("conversion_rates")
        .select("miles_currency");

      if (error) {
        console.error("Error fetching available miles currencies:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get unique miles currencies
      const uniqueCurrencies = [
        ...new Set(
          data.map((row: { miles_currency: string }) => row.miles_currency)
        ),
      ];
      return uniqueCurrencies.sort() as string[];
    } catch (error) {
      console.error("Error in getAvailableMilesCurrencies:", error);
      return [];
    }
  }

  // ============================================================================
  // NEW ID-BASED METHODS
  // ============================================================================

  /**
   * Get all reward currencies from the database
   */
  public async getRewardCurrencies(): Promise<RewardCurrency[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("reward_currencies")
        .select("*")
        .order("display_name");

      if (error) {
        console.error("Error fetching reward currencies:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return (data as DbRewardCurrency[]).map(toRewardCurrency);
    } catch (error) {
      console.error("Error in getRewardCurrencies:", error);
      return [];
    }
  }

  /**
   * Get all miles currencies from the database
   */
  public async getMilesCurrencies(): Promise<MilesCurrencyType[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("miles_currencies")
        .select("*")
        .order("display_name");

      if (error) {
        console.error("Error fetching miles currencies:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return (data as DbMilesCurrency[]).map(toMilesCurrency);
    } catch (error) {
      console.error("Error in getMilesCurrencies:", error);
      return [];
    }
  }

  /**
   * Get conversion rate by currency IDs
   *
   * @param rewardCurrencyId - UUID of the reward currency
   * @param milesCurrencyId - UUID of the miles currency
   * @returns Conversion rate or null if not found
   */
  public async getConversionRateById(
    rewardCurrencyId: string,
    milesCurrencyId: string
  ): Promise<number | null> {
    const cacheKey = `id:${rewardCurrencyId}:${milesCurrencyId}`;

    // Check cache first
    if (this.isCacheValid() && this.conversionRateCache.has(cacheKey)) {
      const cached = this.conversionRateCache.get(cacheKey) || null;
      return cached === 0 ? null : cached;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("conversion_rates")
        .select("conversion_rate")
        .eq("reward_currency_id", rewardCurrencyId)
        .eq("miles_currency_id", milesCurrencyId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching conversion rate by ID:", error);
        return null;
      }

      if (!data) {
        // Cache the null result
        this.conversionRateCache.set(cacheKey, 0);
        return null;
      }

      const rate = data.conversion_rate;
      this.conversionRateCache.set(cacheKey, rate);
      this.cacheTimestamp = Date.now();
      return rate;
    } catch (error) {
      console.error("Error in getConversionRateById:", error);
      return null;
    }
  }

  /**
   * Convert reward points to miles using currency IDs
   *
   * @param points - Number of reward points to convert
   * @param rewardCurrencyId - UUID of the reward currency
   * @param milesCurrencyId - UUID of the miles currency
   * @returns Object containing converted miles and the rate used
   */
  public async convertToMilesById(
    points: number,
    rewardCurrencyId: string,
    milesCurrencyId: string
  ): Promise<{ miles: number | null; rate: number | null }> {
    const rate = await this.getConversionRateById(
      rewardCurrencyId,
      milesCurrencyId
    );

    if (rate === null) {
      return { miles: null, rate: null };
    }

    const miles = points * rate;
    return { miles, rate };
  }

  /**
   * Get a reward currency by its ID
   */
  public async getRewardCurrencyById(
    id: string
  ): Promise<RewardCurrency | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("reward_currencies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return toRewardCurrency(data as DbRewardCurrency);
    } catch (error) {
      console.error("Error in getRewardCurrencyById:", error);
      return null;
    }
  }

  /**
   * Get a miles currency by its ID
   */
  public async getMilesCurrencyById(
    id: string
  ): Promise<MilesCurrencyType | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("miles_currencies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return toMilesCurrency(data as DbMilesCurrency);
    } catch (error) {
      console.error("Error in getMilesCurrencyById:", error);
      return null;
    }
  }

  /**
   * Get reward currency by issuer name (for auto-matching)
   */
  public async getRewardCurrencyByIssuer(
    issuer: string
  ): Promise<RewardCurrency | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("reward_currencies")
        .select("*")
        .ilike("issuer", issuer)
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return toRewardCurrency(data as DbRewardCurrency);
    } catch (error) {
      console.error("Error in getRewardCurrencyByIssuer:", error);
      return null;
    }
  }
}
