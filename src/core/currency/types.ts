/**
 * Currency types for the normalized currency system
 *
 * Uses the unified reward_currencies table with is_transferrable flag:
 * - Source currencies: is_transferrable = true (bank points like Citi ThankYou)
 * - Target currencies: is_transferrable = false (airline miles like KrisFlyer)
 */

/**
 * Reward currency - represents points earned from credit cards or airline miles
 * Examples: Citi ThankYou Points, DBS Points, UNI$, KrisFlyer Miles, Aeroplan Points
 *
 * isTransferrable:
 * - TRUE: Bank points that can transfer to airlines (Citi ThankYou, DBS Points, etc.)
 * - FALSE: Airline miles that are endpoints (KrisFlyer, Aeroplan, etc.)
 */
export interface RewardCurrency {
  id: string;
  code: string;
  displayName: string;
  issuer?: string;
  isTransferrable: boolean;
  logoUrl?: string;
  bgColor?: string;
  logoScale?: number;
}

/**
 * Database model for reward currencies
 */
export interface DbRewardCurrency {
  id: string;
  code: string;
  display_name: string;
  issuer: string | null;
  is_transferrable: boolean;
  logo_url: string | null;
  bg_color: string | null;
  logo_scale: number | null;
  created_at: string;
}

/**
 * Miles currency - represents airline loyalty program points
 * Examples: KrisFlyer Miles, Asia Miles, Aeroplan Points
 *
 * @deprecated Use RewardCurrency with isTransferrable=false instead.
 * This type is kept for backward compatibility.
 */
export interface MilesCurrencyType {
  id: string;
  code: string;
  displayName: string;
}

/**
 * Conversion rate between a source currency and target currency
 */
export interface ConversionRate {
  id: string;
  sourceCurrencyId: string;
  targetCurrencyId: string;
  rate: number;
  sourceCurrency?: RewardCurrency;
  targetCurrency?: RewardCurrency;
}

/**
 * Database model for conversion rates
 */
export interface DbConversionRate {
  id: string;
  reward_currency_id: string;
  target_currency_id: string;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

/**
 * Helper to convert DB reward currency to app model
 */
export function toRewardCurrency(db: DbRewardCurrency): RewardCurrency {
  return {
    id: db.id,
    code: db.code,
    displayName: db.display_name,
    issuer: db.issuer ?? undefined,
    isTransferrable: db.is_transferrable,
    logoUrl: db.logo_url ?? undefined,
    bgColor: db.bg_color ?? undefined,
    logoScale: db.logo_scale ?? undefined,
  };
}

/**
 * Helper to convert DB conversion rate to app model
 */
export function toConversionRate(db: DbConversionRate): ConversionRate {
  return {
    id: db.id,
    sourceCurrencyId: db.reward_currency_id,
    targetCurrencyId: db.target_currency_id,
    rate: db.conversion_rate,
  };
}
