/**
 * Service for accessing the card catalog
 *
 * The card catalog contains universal credit card definitions that are shared
 * across all users. This service provides read-only access to the catalog.
 * Write operations are restricted to admin/service role only.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  CardCatalogEntry,
  CardCatalogFilter,
  DbCardCatalogEntry,
  mapDbToCardCatalogEntry,
} from "./types";

export class CardCatalogService {
  private static instance: CardCatalogService;

  // Caching infrastructure
  private cardByIdCache: Map<string, CardCatalogEntry> = new Map();
  private cardByTypeIdCache: Map<string, CardCatalogEntry> = new Map();
  private allCardsCache: CardCatalogEntry[] | null = null;
  private issuersCache: Map<string, string[]> = new Map(); // keyed by region or "all"
  private regionsCache: string[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes (catalog rarely changes)

  private constructor() {}

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    return Date.now() - this.cacheTimestamp < this.CACHE_TTL;
  }

  /**
   * Clear all caches (call when catalog is updated)
   */
  public clearCache(): void {
    this.cardByIdCache.clear();
    this.cardByTypeIdCache.clear();
    this.allCardsCache = null;
    this.issuersCache.clear();
    this.regionsCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Update cache timestamp
   */
  private touchCache(): void {
    this.cacheTimestamp = Date.now();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CardCatalogService {
    if (!CardCatalogService.instance) {
      CardCatalogService.instance = new CardCatalogService();
    }
    return CardCatalogService.instance;
  }

  /**
   * Get all cards from the catalog with optional filtering
   * Results are cached when no filter is applied (default active-only query)
   */
  async getCards(filter?: CardCatalogFilter): Promise<CardCatalogEntry[]> {
    // Use cache for default query (no filters except active status)
    const isDefaultQuery =
      !filter?.includeInactive &&
      !filter?.region &&
      !filter?.issuer &&
      !filter?.search;

    if (isDefaultQuery && this.isCacheValid() && this.allCardsCache) {
      return this.allCardsCache;
    }

    let query = supabase
      .from("card_catalog")
      .select("*")
      .order("issuer")
      .order("name");

    // Filter by active status (default: only active)
    if (!filter?.includeInactive) {
      query = query.eq("is_active", true);
    }

    // Filter by region
    if (filter?.region) {
      query = query.eq("region", filter.region);
    }

    // Filter by issuer
    if (filter?.issuer) {
      query = query.eq("issuer", filter.issuer);
    }

    // Search by name or issuer
    if (filter?.search) {
      const searchTerm = `%${filter.search}%`;
      query = query.or(`name.ilike.${searchTerm},issuer.ilike.${searchTerm}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching card catalog:", error);
      throw error;
    }

    const cards = ((data as DbCardCatalogEntry[]) || []).map(
      mapDbToCardCatalogEntry
    );

    // Cache default query result and populate individual caches
    if (isDefaultQuery) {
      this.allCardsCache = cards;
      this.touchCache();

      // Also populate individual card caches
      for (const card of cards) {
        this.cardByIdCache.set(card.id, card);
        this.cardByTypeIdCache.set(card.cardTypeId, card);
      }
    }

    return cards;
  }

  /**
   * Get a single card by its UUID
   * Results are cached for 30 minutes
   */
  async getCardById(id: string): Promise<CardCatalogEntry | null> {
    // Check cache first
    if (this.isCacheValid() && this.cardByIdCache.has(id)) {
      return this.cardByIdCache.get(id) || null;
    }

    const { data, error } = await supabase
      .from("card_catalog")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      console.error("Error fetching card from catalog:", error);
      throw error;
    }

    const card = mapDbToCardCatalogEntry(data as DbCardCatalogEntry);

    // Cache the result
    this.cardByIdCache.set(id, card);
    this.cardByTypeIdCache.set(card.cardTypeId, card);
    this.touchCache();

    return card;
  }

  /**
   * Get a single card by its card_type_id
   * Results are cached for 30 minutes
   */
  async getCardByTypeId(cardTypeId: string): Promise<CardCatalogEntry | null> {
    // Check cache first
    if (this.isCacheValid() && this.cardByTypeIdCache.has(cardTypeId)) {
      return this.cardByTypeIdCache.get(cardTypeId) || null;
    }

    const { data, error } = await supabase
      .from("card_catalog")
      .select("*")
      .eq("card_type_id", cardTypeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      console.error("Error fetching card from catalog by type ID:", error);
      throw error;
    }

    const card = mapDbToCardCatalogEntry(data as DbCardCatalogEntry);

    // Cache the result
    this.cardByIdCache.set(card.id, card);
    this.cardByTypeIdCache.set(cardTypeId, card);
    this.touchCache();

    return card;
  }

  /**
   * Get unique issuers from the catalog for filtering
   * Results are cached for 30 minutes
   */
  async getIssuers(region?: string): Promise<string[]> {
    const cacheKey = region || "all";

    // Check cache first
    if (this.isCacheValid() && this.issuersCache.has(cacheKey)) {
      return this.issuersCache.get(cacheKey) || [];
    }

    let query = supabase
      .from("card_catalog")
      .select("issuer")
      .eq("is_active", true);

    if (region) {
      query = query.eq("region", region);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching issuers from catalog:", error);
      throw error;
    }

    // Get unique issuers and sort alphabetically
    const uniqueIssuers = [...new Set(data?.map((d) => d.issuer) || [])];
    const sortedIssuers = uniqueIssuers.sort();

    // Cache the result
    this.issuersCache.set(cacheKey, sortedIssuers);
    this.touchCache();

    return sortedIssuers;
  }

  /**
   * Get unique regions from the catalog
   * Results are cached for 30 minutes
   */
  async getRegions(): Promise<string[]> {
    // Check cache first
    if (this.isCacheValid() && this.regionsCache) {
      return this.regionsCache;
    }

    const { data, error } = await supabase
      .from("card_catalog")
      .select("region")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching regions from catalog:", error);
      throw error;
    }

    // Get unique regions and sort alphabetically
    const uniqueRegions = [...new Set(data?.map((d) => d.region) || [])];
    const sortedRegions = uniqueRegions.sort();

    // Cache the result
    this.regionsCache = sortedRegions;
    this.touchCache();

    return sortedRegions;
  }

  /**
   * Get cards grouped by issuer
   */
  async getCardsGroupedByIssuer(
    filter?: CardCatalogFilter
  ): Promise<Map<string, CardCatalogEntry[]>> {
    const cards = await this.getCards(filter);
    const grouped = new Map<string, CardCatalogEntry[]>();

    for (const card of cards) {
      const existing = grouped.get(card.issuer) || [];
      existing.push(card);
      grouped.set(card.issuer, existing);
    }

    return grouped;
  }
}

// Export singleton instance
export const cardCatalogService = CardCatalogService.getInstance();
