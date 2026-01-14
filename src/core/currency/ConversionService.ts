import { supabase } from "@/integrations/supabase/client";
import {
  RewardCurrency,
  MilesCurrencyType,
  DbRewardCurrency,
  toRewardCurrency,
} from "./types";

/**
 * ConversionService manages currency conversion logic and rate retrieval
 * for converting reward points to miles currencies.
 *
 * Uses the unified reward_currencies table with is_transferrable flag:
 * - Source currencies: is_transferrable = true (bank points like Citi ThankYou)
 * - Target currencies: is_transferrable = false (airline miles like KrisFlyer)
 */
export class ConversionService {
  private static instance: ConversionService;
  private conversionRateCache: Map<string, number> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes (rates don't change frequently)

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
   * Generate cache key for a conversion rate (ID-based)
   */
  private getCacheKey(
    sourceCurrencyId: string,
    targetCurrencyId: string
  ): string {
    return `id:${sourceCurrencyId}:${targetCurrencyId}`;
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

  // ============================================================================
  // CURRENCY RETRIEVAL METHODS
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
   * Get all miles/destination currencies from the database (is_transferrable = FALSE)
   * These are airline loyalty currencies like KrisFlyer, Aeroplan, etc.
   * @deprecated Use getDestinationCurrencies() instead
   */
  public async getMilesCurrencies(): Promise<MilesCurrencyType[]> {
    const currencies = await this.getDestinationCurrencies();
    // Map RewardCurrency to MilesCurrencyType for backward compatibility
    return currencies.map((c) => ({
      id: c.id,
      code: c.code,
      displayName: c.displayName,
    }));
  }

  /**
   * Get all transferrable reward currencies (bank points that can transfer to airlines)
   * Examples: Citi ThankYou Points, DBS Points, UNI$
   */
  public async getTransferrableCurrencies(): Promise<RewardCurrency[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("reward_currencies")
        .select("*")
        .eq("is_transferrable", true)
        .order("display_name");

      if (error) {
        console.error("Error fetching transferrable currencies:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return (data as DbRewardCurrency[]).map(toRewardCurrency);
    } catch (error) {
      console.error("Error in getTransferrableCurrencies:", error);
      return [];
    }
  }

  /**
   * Get all destination currencies (airline miles that are endpoints)
   * These are currencies with is_transferrable = FALSE
   * Examples: KrisFlyer Miles, Aeroplan Points, Avios
   */
  public async getDestinationCurrencies(): Promise<RewardCurrency[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("reward_currencies")
        .select("*")
        .eq("is_transferrable", false)
        .order("display_name");

      if (error) {
        console.error("Error fetching destination currencies:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return (data as DbRewardCurrency[]).map(toRewardCurrency);
    } catch (error) {
      console.error("Error in getDestinationCurrencies:", error);
      return [];
    }
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
   * Get a miles/destination currency by its ID
   * @deprecated Use getDestinationCurrencyById() instead
   */
  public async getMilesCurrencyById(
    id: string
  ): Promise<MilesCurrencyType | null> {
    const currency = await this.getDestinationCurrencyById(id);
    if (!currency) return null;
    // Map to MilesCurrencyType for backward compatibility
    return {
      id: currency.id,
      code: currency.code,
      displayName: currency.displayName,
    };
  }

  /**
   * Get a destination currency by its ID (from unified reward_currencies table)
   */
  public async getDestinationCurrencyById(
    id: string
  ): Promise<RewardCurrency | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("reward_currencies")
        .select("*")
        .eq("id", id)
        .eq("is_transferrable", false)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return toRewardCurrency(data as DbRewardCurrency);
    } catch (error) {
      console.error("Error in getDestinationCurrencyById:", error);
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

  // ============================================================================
  // CONVERSION RATE METHODS
  // ============================================================================

  /**
   * Get conversion rate by currency IDs
   *
   * @param sourceCurrencyId - UUID of the source reward currency (is_transferrable = TRUE)
   * @param targetCurrencyId - UUID of the target currency (is_transferrable = FALSE)
   * @returns Conversion rate or null if not found
   */
  public async getConversionRateById(
    sourceCurrencyId: string,
    targetCurrencyId: string
  ): Promise<number | null> {
    const cacheKey = this.getCacheKey(sourceCurrencyId, targetCurrencyId);

    // Check cache first
    if (this.isCacheValid() && this.conversionRateCache.has(cacheKey)) {
      const cached = this.conversionRateCache.get(cacheKey) || null;
      return cached === 0 ? null : cached;
    }

    try {
      // Query using target_currency_id (unified schema after migration)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("conversion_rates")
        .select("conversion_rate")
        .eq("reward_currency_id", sourceCurrencyId)
        .eq("target_currency_id", targetCurrencyId)
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
   * @param sourceCurrencyId - UUID of the source reward currency
   * @param targetCurrencyId - UUID of the target currency (airline miles)
   * @returns Object containing converted miles and the rate used
   */
  public async convertToMilesById(
    points: number,
    sourceCurrencyId: string,
    targetCurrencyId: string
  ): Promise<{ miles: number | null; rate: number | null }> {
    const rate = await this.getConversionRateById(
      sourceCurrencyId,
      targetCurrencyId
    );

    if (rate === null) {
      return { miles: null, rate: null };
    }

    const miles = points * rate;
    return { miles, rate };
  }

  /**
   * Get all conversion rates with currency IDs
   */
  public async getAllConversionRatesWithCurrencies(): Promise<
    Array<{
      id: string;
      sourceCurrencyId: string;
      targetCurrencyId: string;
      rate: number;
      minimumTransfer: number | null;
      transferIncrement: number | null;
    }>
  > {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("conversion_rates")
        .select(
          "id, reward_currency_id, target_currency_id, conversion_rate, minimum_transfer, transfer_increment"
        )
        .not("reward_currency_id", "is", null)
        .not("target_currency_id", "is", null);

      if (error) {
        console.error("Error fetching conversion rates:", error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map(
        (row: {
          id: string;
          reward_currency_id: string;
          target_currency_id: string;
          conversion_rate: number;
          minimum_transfer: number | null;
          transfer_increment: number | null;
        }) => ({
          id: row.id,
          sourceCurrencyId: row.reward_currency_id,
          targetCurrencyId: row.target_currency_id,
          rate: row.conversion_rate,
          minimumTransfer: row.minimum_transfer,
          transferIncrement: row.transfer_increment,
        })
      );
    } catch (error) {
      console.error("Error in getAllConversionRatesWithCurrencies:", error);
      return [];
    }
  }

  /**
   * Upsert a conversion rate using currency IDs
   */
  public async upsertConversionRateById(
    sourceCurrencyId: string,
    targetCurrencyId: string,
    rate: number
  ): Promise<void> {
    if (rate <= 0) {
      throw new Error("Conversion rate must be a positive number");
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("conversion_rates").upsert(
        {
          reward_currency_id: sourceCurrencyId,
          target_currency_id: targetCurrencyId,
          conversion_rate: rate,
        },
        {
          onConflict: "reward_currency_id,target_currency_id",
        }
      );

      if (error) {
        console.error("Error upserting conversion rate:", error);
        throw new Error(`Failed to upsert conversion rate: ${error.message}`);
      }

      // Clear cache
      this.clearCache();
    } catch (error) {
      console.error("Error in upsertConversionRateById:", error);
      throw error;
    }
  }

  /**
   * Batch upsert conversion rates using currency IDs
   */
  public async batchUpsertConversionRatesById(
    updates: Array<{
      sourceCurrencyId: string;
      targetCurrencyId: string;
      rate: number;
      minimumTransfer?: number | null;
      transferIncrement?: number | null;
    }>
  ): Promise<void> {
    // Validate all rates
    for (const update of updates) {
      if (update.rate <= 0) {
        throw new Error("All conversion rates must be positive numbers");
      }
      if (
        update.minimumTransfer !== undefined &&
        update.minimumTransfer !== null &&
        update.minimumTransfer <= 0
      ) {
        throw new Error("Minimum transfer must be a positive number");
      }
      if (
        update.transferIncrement !== undefined &&
        update.transferIncrement !== null &&
        update.transferIncrement <= 0
      ) {
        throw new Error("Transfer increment must be a positive number");
      }
    }

    try {
      const upsertData = updates.map((update) => ({
        reward_currency_id: update.sourceCurrencyId,
        target_currency_id: update.targetCurrencyId,
        conversion_rate: update.rate,
        minimum_transfer: update.minimumTransfer ?? null,
        transfer_increment: update.transferIncrement ?? null,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("conversion_rates")
        .upsert(upsertData, {
          onConflict: "reward_currency_id,target_currency_id",
        });

      if (error) {
        console.error("Error batch upserting conversion rates:", error);
        throw new Error(
          `Failed to batch upsert conversion rates: ${error.message}`
        );
      }

      // Clear cache
      this.clearCache();
    } catch (error) {
      console.error("Error in batchUpsertConversionRatesById:", error);
      throw error;
    }
  }

  /**
   * Delete all conversion rates for a source currency
   */
  public async deleteConversionRatesForSourceCurrency(
    sourceCurrencyId: string
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("conversion_rates")
        .delete()
        .eq("reward_currency_id", sourceCurrencyId);

      if (error) {
        console.error("Error deleting conversion rates:", error);
        throw new Error(`Failed to delete conversion rates: ${error.message}`);
      }

      // Clear cache
      this.clearCache();
    } catch (error) {
      console.error("Error in deleteConversionRatesForSourceCurrency:", error);
      throw error;
    }
  }

  /**
   * Delete a specific conversion rate by source and target currency IDs
   */
  public async deleteConversionRateById(
    sourceCurrencyId: string,
    targetCurrencyId: string
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("conversion_rates")
        .delete()
        .eq("reward_currency_id", sourceCurrencyId)
        .eq("target_currency_id", targetCurrencyId);

      if (error) {
        console.error("Error deleting conversion rate:", error);
        throw new Error(`Failed to delete conversion rate: ${error.message}`);
      }

      // Clear cache
      this.clearCache();
    } catch (error) {
      console.error("Error in deleteConversionRateById:", error);
      throw error;
    }
  }
}
