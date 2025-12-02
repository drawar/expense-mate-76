import { supabase } from "@/integrations/supabase/client";

/**
 * Miles currency options for conversion
 */
export type MilesCurrency =
  | "KrisFlyer"
  | "AsiaMiles"
  | "Avios"
  | "FlyingBlue"
  | "Aeroplan"
  | "Velocity";

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
  private getCacheKey(rewardCurrency: string, milesCurrency: MilesCurrency): string {
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
    const cacheKey = this.getCacheKey(rewardCurrency, milesCurrency);

    // Check cache first
    if (this.isCacheValid() && this.conversionRateCache.has(cacheKey)) {
      return this.conversionRateCache.get(cacheKey) || null;
    }

    try {
      const { data, error } = await supabase
        .from("conversion_rates" as any)
        .select("conversion_rate")
        .eq("reward_currency", rewardCurrency)
        .eq("miles_currency", milesCurrency)
        .maybeSingle();

      if (error) {
        console.error("Error fetching conversion rate:", error);
        return null;
      }

      if (!data) {
        // Cache the null result to avoid repeated queries
        this.conversionRateCache.set(cacheKey, 0);
        return null;
      }

      // Cache the result
      const conversionRate = (data as any).conversion_rate;
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
      const { data, error } = await supabase
        .from("conversion_rates" as any)
        .select("miles_currency, conversion_rate")
        .eq("reward_currency", rewardCurrency);

      if (error) {
        console.error("Error fetching conversion rates for reward currency:", error);
        return {};
      }

      if (!data || data.length === 0) {
        return {};
      }

      // Build the result object and update cache
      const result: Partial<Record<MilesCurrency, number>> = {};
      data.forEach((row: any) => {
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
      const { data, error } = await supabase
        .from("conversion_rates" as any)
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
      data.forEach((row: any) => {
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
      const { error } = await supabase
        .from("conversion_rates" as any)
        .upsert(
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
        throw new Error(`Conversion rate must be a positive number: ${update.rewardCurrency} -> ${update.milesCurrency}`);
      }
    }

    try {
      const upsertData = updates.map((update) => ({
        reward_currency: update.rewardCurrency,
        miles_currency: update.milesCurrency,
        conversion_rate: update.rate,
      }));

      const { error } = await supabase
        .from("conversion_rates" as any)
        .upsert(upsertData, {
          onConflict: "reward_currency,miles_currency",
        });

      if (error) {
        console.error("Error batch updating conversion rates:", error);
        throw new Error(`Failed to batch update conversion rates: ${error.message}`);
      }

      // Clear cache to force refresh on next read
      this.clearCache();
    } catch (error) {
      console.error("Error in batchUpdateConversionRates:", error);
      throw error;
    }
  }
}
