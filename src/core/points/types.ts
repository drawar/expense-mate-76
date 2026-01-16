/**
 * Points Manager types
 *
 * TypeScript interfaces for the Points Manager feature including:
 * - Balance tracking (hybrid mode: starting balance + earned from transactions)
 * - Manual adjustments (bonuses, corrections, expired, promotional)
 * - Redemptions (with flight-specific fields and CPP calculation)
 * - Transfers between reward programs
 * - Redemption goals
 */

import { RewardCurrency } from "@/core/currency/types";

// ============================================================================
// BALANCE TYPES
// ============================================================================

/**
 * Points balance for a specific reward currency
 */
export interface PointsBalance {
  id: string;
  userId: string;
  rewardCurrencyId: string;
  rewardCurrency?: RewardCurrency;
  cardTypeId?: string; // @deprecated - Use paymentMethodId instead
  /** UUID foreign key to payment_methods for card-specific balances */
  paymentMethodId?: string;
  cardTypeName?: string; // Display name of the card type (joined from card_catalog)
  cardImageUrl?: string; // Card image URL from card_catalog
  startingBalance: number;
  currentBalance: number;
  balanceDate?: Date; // Date the balance was recorded as of
  expiryDate?: Date; // Date when points expire
  lastCalculatedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database model for points_balances
 */
export interface DbPointsBalance {
  id: string;
  user_id: string;
  reward_currency_id: string;
  card_type_id: string | null; // @deprecated - Use payment_method_id instead
  /** UUID foreign key to payment_methods for card-specific balances */
  payment_method_id: string | null;
  starting_balance: number;
  current_balance: number;
  balance_date: string | null;
  expiry_date: string | null;
  last_calculated_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  reward_currencies?: {
    id: string;
    code: string;
    display_name: string;
    issuer: string | null;
    is_transferrable: boolean;
    logo_url: string | null;
    bg_color: string | null;
    logo_scale: number | null;
  };
}

/**
 * Input for creating/updating a balance
 */
export interface PointsBalanceInput {
  rewardCurrencyId: string;
  cardTypeId?: string; // @deprecated - Use paymentMethodId instead
  /** UUID foreign key to payment_methods for card-specific balances */
  paymentMethodId?: string;
  startingBalance: number;
  balanceDate?: Date;
  expiryDate?: Date;
  notes?: string;
}

// ============================================================================
// ADJUSTMENT TYPES
// ============================================================================

export type AdjustmentType =
  | "starting_balance"
  | "bonus"
  | "correction"
  | "expired"
  | "promotional"
  | "other";

/**
 * Manual points adjustment
 */
export interface PointsAdjustment {
  id: string;
  userId: string;
  rewardCurrencyId: string;
  rewardCurrency?: RewardCurrency;
  amount: number; // Positive for additions, negative for deductions
  adjustmentType: AdjustmentType;
  description: string;
  referenceNumber?: string;
  adjustmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database model for points_adjustments
 */
export interface DbPointsAdjustment {
  id: string;
  user_id: string;
  reward_currency_id: string;
  amount: number;
  adjustment_type: string;
  description: string;
  reference_number: string | null;
  adjustment_date: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  // Joined fields
  reward_currencies?: {
    id: string;
    code: string;
    display_name: string;
    issuer: string | null;
    is_transferrable: boolean;
    logo_url: string | null;
    bg_color: string | null;
    logo_scale: number | null;
  };
}

/**
 * Input for creating/updating an adjustment
 */
export interface PointsAdjustmentInput {
  rewardCurrencyId: string;
  amount: number;
  adjustmentType: AdjustmentType;
  description: string;
  referenceNumber?: string;
  adjustmentDate?: Date;
}

// ============================================================================
// REDEMPTION TYPES
// ============================================================================

export type RedemptionType =
  | "flight"
  | "hotel"
  | "merchandise"
  | "cash_back"
  | "statement_credit"
  | "transfer_out"
  | "other";

export type CabinClass = "economy" | "premium_economy" | "business" | "first";

/**
 * Points redemption record
 */
export interface PointsRedemption {
  id: string;
  userId: string;
  rewardCurrencyId: string;
  rewardCurrency?: RewardCurrency;
  pointsRedeemed: number;
  redemptionType: RedemptionType;
  description: string;
  // Flight-specific fields
  flightRoute?: string;
  cabinClass?: CabinClass;
  airline?: string;
  bookingReference?: string;
  passengers?: number;
  // CPP fields
  cashValue?: number;
  cashValueCurrency?: string;
  cpp?: number; // Cents per point (auto-calculated)
  // Dates
  redemptionDate: Date;
  travelDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database model for points_redemptions
 */
export interface DbPointsRedemption {
  id: string;
  user_id: string;
  reward_currency_id: string;
  points_redeemed: number;
  redemption_type: string;
  description: string;
  flight_route: string | null;
  cabin_class: string | null;
  airline: string | null;
  booking_reference: string | null;
  passengers: number | null;
  cash_value: number | null;
  cash_value_currency: string | null;
  cpp: number | null;
  redemption_date: string;
  travel_date: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  // Joined fields
  reward_currencies?: {
    id: string;
    code: string;
    display_name: string;
    issuer: string | null;
    is_transferrable: boolean;
    logo_url: string | null;
    bg_color: string | null;
    logo_scale: number | null;
  };
}

/**
 * Input for creating/updating a redemption
 */
export interface PointsRedemptionInput {
  rewardCurrencyId: string;
  pointsRedeemed: number;
  redemptionType: RedemptionType;
  description: string;
  // Flight-specific fields
  flightRoute?: string;
  cabinClass?: CabinClass;
  airline?: string;
  bookingReference?: string;
  passengers?: number;
  // CPP fields
  cashValue?: number;
  cashValueCurrency?: string;
  // Dates
  redemptionDate?: Date;
  travelDate?: Date;
}

// ============================================================================
// TRANSFER TYPES
// ============================================================================

/**
 * Points transfer between reward programs
 */
export interface PointsTransfer {
  id: string;
  userId: string;
  sourceCurrencyId: string;
  sourceCurrency?: RewardCurrency;
  sourceAmount: number;
  destinationCurrencyId: string;
  destinationCurrency?: RewardCurrency;
  destinationAmount: number;
  conversionRate: number;
  transferBonusRate?: number;
  transferFee: number;
  transferFeeCurrency?: string;
  referenceNumber?: string;
  notes?: string;
  transferDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database model for points_transfers
 */
export interface DbPointsTransfer {
  id: string;
  user_id: string;
  source_currency_id: string;
  source_amount: number;
  destination_currency_id: string;
  destination_amount: number;
  conversion_rate: number;
  transfer_bonus_rate: number | null;
  transfer_fee: number;
  transfer_fee_currency: string | null;
  reference_number: string | null;
  notes: string | null;
  transfer_date: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  // Joined fields
  source_currency?: {
    id: string;
    code: string;
    display_name: string;
    issuer: string | null;
    is_transferrable: boolean;
    logo_url: string | null;
    bg_color: string | null;
    logo_scale: number | null;
  };
  destination_currency?: {
    id: string;
    code: string;
    display_name: string;
    issuer: string | null;
    is_transferrable: boolean;
    logo_url: string | null;
    bg_color: string | null;
    logo_scale: number | null;
  };
}

/**
 * Input for creating/updating a transfer
 */
export interface PointsTransferInput {
  sourceCurrencyId: string;
  sourceAmount: number;
  destinationCurrencyId: string;
  destinationAmount: number;
  conversionRate: number;
  transferBonusRate?: number;
  transferFee?: number;
  transferFeeCurrency?: string;
  referenceNumber?: string;
  notes?: string;
  transferDate?: Date;
}

// ============================================================================
// GOAL TYPES
// ============================================================================

export type GoalType = "flight" | "hotel" | "merchandise" | "other";
export type GoalStatus = "active" | "completed" | "cancelled";

/**
 * Redemption goal
 */
export interface PointsGoal {
  id: string;
  userId: string;
  rewardCurrencyId: string;
  rewardCurrency?: RewardCurrency;
  goalName: string;
  goalDescription?: string;
  targetPoints: number;
  goalType?: GoalType;
  priority: number;
  targetDate?: Date;
  targetRoute?: string;
  targetCabin?: CabinClass;
  status: GoalStatus;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Database model for points_goals
 */
export interface DbPointsGoal {
  id: string;
  user_id: string;
  reward_currency_id: string;
  goal_name: string;
  goal_description: string | null;
  target_points: number;
  goal_type: string | null;
  priority: number;
  target_date: string | null;
  target_route: string | null;
  target_cabin: string | null;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  // Joined fields
  reward_currencies?: {
    id: string;
    code: string;
    display_name: string;
    issuer: string | null;
    is_transferrable: boolean;
    logo_url: string | null;
    bg_color: string | null;
    logo_scale: number | null;
  };
}

/**
 * Input for creating/updating a goal
 */
export interface PointsGoalInput {
  rewardCurrencyId: string;
  goalName: string;
  goalDescription?: string;
  targetPoints: number;
  goalType?: GoalType;
  priority?: number;
  targetDate?: Date;
  targetRoute?: string;
  targetCabin?: CabinClass;
}

// ============================================================================
// ACTIVITY FEED TYPES
// ============================================================================

/**
 * Activity feed item - unified type for all activity types
 */
export type ActivityItem =
  | { type: "adjustment"; data: PointsAdjustment; date: Date }
  | { type: "redemption"; data: PointsRedemption; date: Date }
  | { type: "transfer"; data: PointsTransfer; date: Date };

/**
 * Activity feed filter options
 */
export interface ActivityFeedFilters {
  types?: ("adjustment" | "redemption" | "transfer")[];
  rewardCurrencyId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ============================================================================
// BALANCE CALCULATION TYPES
// ============================================================================

/**
 * Breakdown of balance components
 */
export interface BalanceBreakdown {
  startingBalance: number;
  earnedFromTransactions: number;
  adjustments: number;
  redemptions: number;
  transfersOut: number;
  transfersIn: number;
  currentBalance: number;
}

/**
 * CPP rating thresholds
 */
export const CPP_THRESHOLDS = {
  EXCELLENT: 2.0, // > 2.0 cpp
  GREAT: 1.5, // 1.5 - 2.0 cpp
  GOOD: 1.0, // 1.0 - 1.5 cpp
  // < 1.0 cpp is "poor"
} as const;

/**
 * Get CPP rating based on value
 */
export function getCppRating(
  cpp: number
): "excellent" | "great" | "good" | "poor" {
  if (cpp >= CPP_THRESHOLDS.EXCELLENT) return "excellent";
  if (cpp >= CPP_THRESHOLDS.GREAT) return "great";
  if (cpp >= CPP_THRESHOLDS.GOOD) return "good";
  return "poor";
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

/**
 * Convert database balance to app model
 */
export function toPointsBalance(db: DbPointsBalance): PointsBalance {
  return {
    id: db.id,
    userId: db.user_id,
    rewardCurrencyId: db.reward_currency_id,
    rewardCurrency: db.reward_currencies
      ? {
          id: db.reward_currencies.id,
          code: db.reward_currencies.code,
          displayName: db.reward_currencies.display_name,
          issuer: db.reward_currencies.issuer ?? undefined,
          isTransferrable: db.reward_currencies.is_transferrable,
          logoUrl: db.reward_currencies.logo_url ?? undefined,
          bgColor: db.reward_currencies.bg_color ?? undefined,
          logoScale: db.reward_currencies.logo_scale ?? undefined,
        }
      : undefined,
    cardTypeId: db.card_type_id ?? undefined,
    paymentMethodId: db.payment_method_id ?? undefined,
    cardTypeName: undefined,
    startingBalance: Number(db.starting_balance),
    currentBalance: Number(db.current_balance),
    balanceDate: db.balance_date ? new Date(db.balance_date) : undefined,
    expiryDate: db.expiry_date ? new Date(db.expiry_date) : undefined,
    lastCalculatedAt: new Date(db.last_calculated_at),
    notes: db.notes ?? undefined,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

/**
 * Convert database adjustment to app model
 */
export function toPointsAdjustment(db: DbPointsAdjustment): PointsAdjustment {
  return {
    id: db.id,
    userId: db.user_id,
    rewardCurrencyId: db.reward_currency_id,
    rewardCurrency: db.reward_currencies
      ? {
          id: db.reward_currencies.id,
          code: db.reward_currencies.code,
          displayName: db.reward_currencies.display_name,
          issuer: db.reward_currencies.issuer ?? undefined,
          isTransferrable: db.reward_currencies.is_transferrable,
          logoUrl: db.reward_currencies.logo_url ?? undefined,
          bgColor: db.reward_currencies.bg_color ?? undefined,
          logoScale: db.reward_currencies.logo_scale ?? undefined,
        }
      : undefined,
    amount: Number(db.amount),
    adjustmentType: db.adjustment_type as AdjustmentType,
    description: db.description,
    referenceNumber: db.reference_number ?? undefined,
    adjustmentDate: new Date(db.adjustment_date),
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

/**
 * Convert database redemption to app model
 */
export function toPointsRedemption(db: DbPointsRedemption): PointsRedemption {
  return {
    id: db.id,
    userId: db.user_id,
    rewardCurrencyId: db.reward_currency_id,
    rewardCurrency: db.reward_currencies
      ? {
          id: db.reward_currencies.id,
          code: db.reward_currencies.code,
          displayName: db.reward_currencies.display_name,
          issuer: db.reward_currencies.issuer ?? undefined,
          isTransferrable: db.reward_currencies.is_transferrable,
          logoUrl: db.reward_currencies.logo_url ?? undefined,
          bgColor: db.reward_currencies.bg_color ?? undefined,
          logoScale: db.reward_currencies.logo_scale ?? undefined,
        }
      : undefined,
    pointsRedeemed: Number(db.points_redeemed),
    redemptionType: db.redemption_type as RedemptionType,
    description: db.description,
    flightRoute: db.flight_route ?? undefined,
    cabinClass: db.cabin_class as CabinClass | undefined,
    airline: db.airline ?? undefined,
    bookingReference: db.booking_reference ?? undefined,
    passengers: db.passengers ?? undefined,
    cashValue: db.cash_value ? Number(db.cash_value) : undefined,
    cashValueCurrency: db.cash_value_currency ?? undefined,
    cpp: db.cpp ? Number(db.cpp) : undefined,
    redemptionDate: new Date(db.redemption_date),
    travelDate: db.travel_date ? new Date(db.travel_date) : undefined,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

/**
 * Convert database transfer to app model
 */
export function toPointsTransfer(db: DbPointsTransfer): PointsTransfer {
  return {
    id: db.id,
    userId: db.user_id,
    sourceCurrencyId: db.source_currency_id,
    sourceCurrency: db.source_currency
      ? {
          id: db.source_currency.id,
          code: db.source_currency.code,
          displayName: db.source_currency.display_name,
          issuer: db.source_currency.issuer ?? undefined,
          isTransferrable: db.source_currency.is_transferrable,
          logoUrl: db.source_currency.logo_url ?? undefined,
          bgColor: db.source_currency.bg_color ?? undefined,
          logoScale: db.source_currency.logo_scale ?? undefined,
        }
      : undefined,
    sourceAmount: Number(db.source_amount),
    destinationCurrencyId: db.destination_currency_id,
    destinationCurrency: db.destination_currency
      ? {
          id: db.destination_currency.id,
          code: db.destination_currency.code,
          displayName: db.destination_currency.display_name,
          issuer: db.destination_currency.issuer ?? undefined,
          isTransferrable: db.destination_currency.is_transferrable,
          logoUrl: db.destination_currency.logo_url ?? undefined,
          bgColor: db.destination_currency.bg_color ?? undefined,
          logoScale: db.destination_currency.logo_scale ?? undefined,
        }
      : undefined,
    destinationAmount: Number(db.destination_amount),
    conversionRate: Number(db.conversion_rate),
    transferBonusRate: db.transfer_bonus_rate
      ? Number(db.transfer_bonus_rate)
      : undefined,
    transferFee: Number(db.transfer_fee),
    transferFeeCurrency: db.transfer_fee_currency ?? undefined,
    referenceNumber: db.reference_number ?? undefined,
    notes: db.notes ?? undefined,
    transferDate: new Date(db.transfer_date),
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

/**
 * Convert database goal to app model
 */
export function toPointsGoal(db: DbPointsGoal): PointsGoal {
  return {
    id: db.id,
    userId: db.user_id,
    rewardCurrencyId: db.reward_currency_id,
    rewardCurrency: db.reward_currencies
      ? {
          id: db.reward_currencies.id,
          code: db.reward_currencies.code,
          displayName: db.reward_currencies.display_name,
          issuer: db.reward_currencies.issuer ?? undefined,
          isTransferrable: db.reward_currencies.is_transferrable,
          logoUrl: db.reward_currencies.logo_url ?? undefined,
          bgColor: db.reward_currencies.bg_color ?? undefined,
          logoScale: db.reward_currencies.logo_scale ?? undefined,
        }
      : undefined,
    goalName: db.goal_name,
    goalDescription: db.goal_description ?? undefined,
    targetPoints: Number(db.target_points),
    goalType: db.goal_type as GoalType | undefined,
    priority: db.priority,
    targetDate: db.target_date ? new Date(db.target_date) : undefined,
    targetRoute: db.target_route ?? undefined,
    targetCabin: db.target_cabin as CabinClass | undefined,
    status: db.status as GoalStatus,
    completedAt: db.completed_at ? new Date(db.completed_at) : undefined,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}
