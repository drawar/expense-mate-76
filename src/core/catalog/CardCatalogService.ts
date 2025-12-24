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

  private constructor() {}

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
   */
  async getCards(filter?: CardCatalogFilter): Promise<CardCatalogEntry[]> {
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

    return ((data as DbCardCatalogEntry[]) || []).map(mapDbToCardCatalogEntry);
  }

  /**
   * Get a single card by its UUID
   */
  async getCardById(id: string): Promise<CardCatalogEntry | null> {
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

    return mapDbToCardCatalogEntry(data as DbCardCatalogEntry);
  }

  /**
   * Get a single card by its card_type_id
   */
  async getCardByTypeId(cardTypeId: string): Promise<CardCatalogEntry | null> {
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

    return mapDbToCardCatalogEntry(data as DbCardCatalogEntry);
  }

  /**
   * Get unique issuers from the catalog for filtering
   */
  async getIssuers(region?: string): Promise<string[]> {
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
    return uniqueIssuers.sort();
  }

  /**
   * Get unique regions from the catalog
   */
  async getRegions(): Promise<string[]> {
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
    return uniqueRegions.sort();
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
