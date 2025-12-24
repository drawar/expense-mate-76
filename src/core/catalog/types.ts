/**
 * Types for the Card Catalog system
 *
 * The card catalog contains universal credit card definitions that are shared
 * across all users. Users can link their payment methods to catalog entries
 * to inherit card properties while maintaining their own instance with
 * customizations like nickname and last 4 digits.
 */

/**
 * A card catalog entry representing a universal card definition
 */
export interface CardCatalogEntry {
  id: string;
  cardTypeId: string;
  name: string;
  issuer: string;
  network?: CardNetwork;
  currency: string;
  pointsCurrency?: string;
  rewardCurrencyId?: string;
  defaultImageUrl?: string;
  defaultColor?: string;
  defaultIcon?: string;
  region: string;
  hasCategories: boolean;
  availableCategories?: string[];
  maxCategoriesSelectable?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Database row format for card_catalog table
 */
export interface DbCardCatalogEntry {
  id: string;
  card_type_id: string;
  name: string;
  issuer: string;
  network: string | null;
  currency: string;
  points_currency: string | null;
  reward_currency_id: string | null;
  default_image_url: string | null;
  default_color: string | null;
  default_icon: string | null;
  region: string;
  has_categories: boolean;
  available_categories: string[] | null;
  max_categories_selectable: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Card network types
 */
export type CardNetwork =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "unknown";

/**
 * Filter options for querying the card catalog
 */
export interface CardCatalogFilter {
  /** Filter by region (e.g., 'SG', 'CA', 'US') */
  region?: string;
  /** Filter by card issuer (e.g., 'American Express', 'DBS') */
  issuer?: string;
  /** Search by card name or issuer */
  search?: string;
  /** Include inactive cards (default: false) */
  includeInactive?: boolean;
}

/**
 * Maps database row format to application format
 */
export function mapDbToCardCatalogEntry(
  row: DbCardCatalogEntry
): CardCatalogEntry {
  return {
    id: row.id,
    cardTypeId: row.card_type_id,
    name: row.name,
    issuer: row.issuer,
    network: (row.network as CardNetwork) || undefined,
    currency: row.currency,
    pointsCurrency: row.points_currency || undefined,
    rewardCurrencyId: row.reward_currency_id || undefined,
    defaultImageUrl: row.default_image_url || undefined,
    defaultColor: row.default_color || undefined,
    defaultIcon: row.default_icon || undefined,
    region: row.region,
    hasCategories: row.has_categories,
    availableCategories: row.available_categories || undefined,
    maxCategoriesSelectable: row.max_categories_selectable || undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
