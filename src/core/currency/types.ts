/**
 * Currency types for the normalized currency system
 */

/**
 * Reward currency - represents points earned from credit cards
 * Examples: Citi ThankYou Points, DBS Points, UNI$
 */
export interface RewardCurrency {
  id: string;
  code: string;
  displayName: string;
  issuer?: string;
}

/**
 * Database model for reward currencies
 */
export interface DbRewardCurrency {
  id: string;
  code: string;
  display_name: string;
  issuer: string | null;
  created_at: string;
}

/**
 * Miles currency - represents airline loyalty program points
 * Examples: KrisFlyer Miles, Asia Miles, Aeroplan Points
 */
export interface MilesCurrencyType {
  id: string;
  code: string;
  displayName: string;
}

/**
 * Database model for miles currencies
 */
export interface DbMilesCurrency {
  id: string;
  code: string;
  display_name: string;
  created_at: string;
}

/**
 * Conversion rate between a reward currency and miles currency
 */
export interface ConversionRate {
  id: string;
  rewardCurrencyId: string;
  milesCurrencyId: string;
  conversionRate: number;
  rewardCurrency?: RewardCurrency;
  milesCurrency?: MilesCurrencyType;
}

/**
 * Database model for conversion rates (updated schema)
 */
export interface DbConversionRateNew {
  id: string;
  reward_currency_id: string;
  miles_currency_id: string;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
  // Joined data
  reward_currencies?: DbRewardCurrency;
  miles_currencies?: DbMilesCurrency;
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
  };
}

/**
 * Helper to convert DB miles currency to app model
 */
export function toMilesCurrency(db: DbMilesCurrency): MilesCurrencyType {
  return {
    id: db.id,
    code: db.code,
    displayName: db.display_name,
  };
}
