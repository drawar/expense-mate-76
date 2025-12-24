/**
 * Property Resolution Service
 *
 * Resolves effective properties for a payment method by merging catalog
 * defaults with user-specific overrides. This enables the separation of
 * universal card definitions from user-specific customizations.
 *
 * Resolution Priority (highest to lowest):
 * 1. User's explicit value on payment method
 * 2. Catalog entry default value
 * 3. Fallback/default value
 */

import { PaymentMethod, Currency } from "@/types";
import { CardCatalogEntry } from "./types";
import { cardCatalogService } from "./CardCatalogService";

/**
 * A payment method with all properties resolved from catalog + user overrides
 */
export interface ResolvedPaymentMethod extends PaymentMethod {
  /** Display name: nickname > pm.name > catalog.name */
  effectiveName: string;
  /** Card name without nickname: pm.name > catalog.name */
  effectiveCardName: string;
  /** Issuer: pm.issuer > catalog.issuer */
  effectiveIssuer: string;
  /** Currency: pm.currency > catalog.currency */
  effectiveCurrency: Currency;
  /** Points currency: pm.pointsCurrency > catalog.pointsCurrency */
  effectivePointsCurrency?: string;
  /** Reward currency ID: pm.rewardCurrencyId > catalog.rewardCurrencyId */
  effectiveRewardCurrencyId?: string;
  /** Image URL: pm.imageUrl > catalog.defaultImageUrl */
  effectiveImageUrl?: string;
  /** Color: pm.color > catalog.defaultColor */
  effectiveColor?: string;
  /** Icon: pm.icon > catalog.defaultIcon */
  effectiveIcon?: string;
  /** Network from catalog */
  effectiveNetwork?: string;
  /** Category selection info from catalog */
  categoryInfo: {
    hasCategories: boolean;
    availableCategories?: string[];
    maxCategoriesSelectable?: number;
  };
  /** Card type ID for reward rules lookup */
  cardTypeId?: string;
  /** The linked catalog entry (if any) */
  catalogEntry?: CardCatalogEntry;
  /** Whether this payment method is linked to a catalog entry */
  isLinkedToCatalog: boolean;
}

export class PropertyResolver {
  /**
   * Get the effective display name for a payment method
   * Priority: nickname > payment method name > catalog name
   */
  static getDisplayName(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): string {
    return (
      paymentMethod.nickname ||
      paymentMethod.name ||
      catalogEntry?.name ||
      "Unknown Card"
    );
  }

  /**
   * Get the effective card name (without considering nickname)
   * Priority: payment method name > catalog name
   */
  static getCardName(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): string {
    return paymentMethod.name || catalogEntry?.name || "Unknown Card";
  }

  /**
   * Get the effective issuer
   * Priority: payment method issuer > catalog issuer
   */
  static getIssuer(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): string {
    return paymentMethod.issuer || catalogEntry?.issuer || "";
  }

  /**
   * Get the effective currency
   * Priority: payment method currency > catalog currency
   */
  static getCurrency(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): Currency {
    return (
      paymentMethod.currency || (catalogEntry?.currency as Currency) || "USD"
    );
  }

  /**
   * Get the effective points currency name
   * Priority: payment method pointsCurrency > catalog pointsCurrency
   */
  static getPointsCurrency(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): string | undefined {
    return paymentMethod.pointsCurrency || catalogEntry?.pointsCurrency;
  }

  /**
   * Get the effective reward currency ID
   * Priority: payment method rewardCurrencyId > catalog rewardCurrencyId
   */
  static getRewardCurrencyId(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): string | undefined {
    return paymentMethod.rewardCurrencyId || catalogEntry?.rewardCurrencyId;
  }

  /**
   * Get the effective image URL
   * Priority: payment method imageUrl > catalog defaultImageUrl
   */
  static getImageUrl(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): string | undefined {
    return paymentMethod.imageUrl || catalogEntry?.defaultImageUrl;
  }

  /**
   * Get the effective color
   * Priority: payment method color > catalog defaultColor
   */
  static getColor(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): string | undefined {
    return paymentMethod.color || catalogEntry?.defaultColor;
  }

  /**
   * Get the effective icon
   * Priority: payment method icon > catalog defaultIcon
   */
  static getIcon(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): string | undefined {
    return paymentMethod.icon || catalogEntry?.defaultIcon;
  }

  /**
   * Get the card network from catalog
   */
  static getNetwork(catalogEntry?: CardCatalogEntry): string | undefined {
    return catalogEntry?.network;
  }

  /**
   * Get category selection info from catalog
   */
  static getCategoryInfo(catalogEntry?: CardCatalogEntry): {
    hasCategories: boolean;
    availableCategories?: string[];
    maxCategoriesSelectable?: number;
  } {
    return {
      hasCategories: catalogEntry?.hasCategories || false,
      availableCategories: catalogEntry?.availableCategories,
      maxCategoriesSelectable: catalogEntry?.maxCategoriesSelectable,
    };
  }

  /**
   * Get the card type ID for reward rules lookup
   * Uses catalog's cardTypeId when linked, otherwise returns undefined
   */
  static getCardTypeId(catalogEntry?: CardCatalogEntry): string | undefined {
    return catalogEntry?.cardTypeId;
  }

  /**
   * Resolve all properties for a payment method
   * Fetches the catalog entry if cardCatalogId is set
   */
  static async resolveAll(
    paymentMethod: PaymentMethod
  ): Promise<ResolvedPaymentMethod> {
    let catalogEntry: CardCatalogEntry | undefined;

    // Fetch catalog entry if linked
    if (paymentMethod.cardCatalogId) {
      try {
        const entry = await cardCatalogService.getCardById(
          paymentMethod.cardCatalogId
        );
        if (entry) {
          catalogEntry = entry;
        }
      } catch (error) {
        console.warn(
          "Failed to fetch catalog entry for payment method:",
          paymentMethod.id,
          error
        );
      }
    }

    return this.resolveWithCatalog(paymentMethod, catalogEntry);
  }

  /**
   * Resolve properties using a pre-fetched catalog entry
   * Use this when you already have the catalog entry to avoid extra DB calls
   */
  static resolveWithCatalog(
    paymentMethod: PaymentMethod,
    catalogEntry?: CardCatalogEntry
  ): ResolvedPaymentMethod {
    return {
      ...paymentMethod,
      effectiveName: this.getDisplayName(paymentMethod, catalogEntry),
      effectiveCardName: this.getCardName(paymentMethod, catalogEntry),
      effectiveIssuer: this.getIssuer(paymentMethod, catalogEntry),
      effectiveCurrency: this.getCurrency(paymentMethod, catalogEntry),
      effectivePointsCurrency: this.getPointsCurrency(
        paymentMethod,
        catalogEntry
      ),
      effectiveRewardCurrencyId: this.getRewardCurrencyId(
        paymentMethod,
        catalogEntry
      ),
      effectiveImageUrl: this.getImageUrl(paymentMethod, catalogEntry),
      effectiveColor: this.getColor(paymentMethod, catalogEntry),
      effectiveIcon: this.getIcon(paymentMethod, catalogEntry),
      effectiveNetwork: this.getNetwork(catalogEntry),
      categoryInfo: this.getCategoryInfo(catalogEntry),
      cardTypeId: this.getCardTypeId(catalogEntry),
      catalogEntry,
      isLinkedToCatalog: !!catalogEntry,
    };
  }

  /**
   * Resolve properties for multiple payment methods
   * Batches catalog lookups for efficiency
   */
  static async resolveMany(
    paymentMethods: PaymentMethod[]
  ): Promise<ResolvedPaymentMethod[]> {
    // Collect unique catalog IDs
    const catalogIds = new Set<string>();
    for (const pm of paymentMethods) {
      if (pm.cardCatalogId) {
        catalogIds.add(pm.cardCatalogId);
      }
    }

    // Fetch all catalog entries at once
    const catalogMap = new Map<string, CardCatalogEntry>();
    if (catalogIds.size > 0) {
      try {
        const cards = await cardCatalogService.getCards({
          includeInactive: true,
        });
        for (const card of cards) {
          catalogMap.set(card.id, card);
        }
      } catch (error) {
        console.warn("Failed to fetch catalog entries:", error);
      }
    }

    // Resolve each payment method
    return paymentMethods.map((pm) => {
      const catalogEntry = pm.cardCatalogId
        ? catalogMap.get(pm.cardCatalogId)
        : undefined;
      return this.resolveWithCatalog(pm, catalogEntry);
    });
  }
}
