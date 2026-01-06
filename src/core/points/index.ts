/**
 * Points Manager module
 *
 * Exports all types and services for the Points Manager feature.
 */

// Service
export {
  PointsBalanceService,
  pointsBalanceService,
} from "./PointsBalanceService";

// Types
export type {
  // Balance types
  PointsBalance,
  PointsBalanceInput,
  DbPointsBalance,
  BalanceBreakdown,
  // Adjustment types
  PointsAdjustment,
  PointsAdjustmentInput,
  DbPointsAdjustment,
  AdjustmentType,
  // Redemption types
  PointsRedemption,
  PointsRedemptionInput,
  DbPointsRedemption,
  RedemptionType,
  CabinClass,
  // Transfer types
  PointsTransfer,
  PointsTransferInput,
  DbPointsTransfer,
  // Goal types
  PointsGoal,
  PointsGoalInput,
  DbPointsGoal,
  GoalType,
  GoalStatus,
  // Activity feed types
  ActivityItem,
  ActivityFeedFilters,
} from "./types";

// Utility functions
export {
  getCppRating,
  CPP_THRESHOLDS,
  toPointsBalance,
  toPointsAdjustment,
  toPointsRedemption,
  toPointsTransfer,
  toPointsGoal,
} from "./types";
