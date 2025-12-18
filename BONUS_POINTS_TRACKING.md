# Bonus Points Tracking Implementation

## Overview
Implemented persistent tracking of bonus points usage to enforce monthly caps on reward rules.

## Changes Made

### 1. Database Migration
- **File**: `supabase/migrations/20251127000001_create_bonus_points_tracking.sql`
- Created `bonus_points_tracking` table to store cumulative bonus points per rule/payment method/period
- Includes RLS policies for user data isolation
- Tracks by: user_id, rule_id, payment_method_id, period_type, period_year, period_month, statement_day

### 2. BonusPointsTracker Service
- **File**: `src/core/rewards/BonusPointsTracker.ts`
- Updated `getUsedBonusPoints()` to query database instead of just using in-memory cache
- Updated `trackBonusPointsUsage()` to persist to database using upsert
- Maintains cache for performance but syncs with database

### 3. RewardService Integration
- **File**: `src/core/rewards/RewardService.ts`
- Fixed monthly cap message logic to account for amount rounding
- Added `appliedRuleId`, `monthlyCap`, and `periodType` to `CalculationResult`
- Now returns rule metadata needed for tracking

### 4. Transaction Storage Integration
- **File**: `src/core/storage/StorageService.ts`
- Added bonus points tracking when transactions are saved
- Automatically tracks bonus points after successful transaction insert
- Recalculates rewards to get applied rule information

### 5. UI Warnings
- **File**: `src/components/expense/form/elements/PointsDisplay.tsx`
- Shows warning when less than 1000 bonus points remaining
- Shows alert when monthly cap is reached
- Displays in both edit and display modes

### 6. Type Updates
- **File**: `src/core/rewards/types.ts`
- Added `appliedRuleId`, `monthlyCap`, `periodType` to `CalculationResult`
- **File**: `src/hooks/useExpenseForm.ts`
- Added `messages` array to `PointsCalculationResult`

## How It Works

1. **When calculating rewards**: RewardService queries BonusPointsTracker for current usage
2. **When saving transaction**: StorageService calls BonusPointsTracker to record bonus points
3. **When viewing form**: PointsDisplay shows warnings if approaching or at cap
4. **Database sync**: All tracking persists to database for accuracy across sessions

## Next Steps

1. Run the migration: `supabase migration up`
2. Test with Citibank card (9000 bonus points cap)
3. Verify warnings appear when approaching cap
4. Confirm tracking persists across page refreshes

## Testing Scenarios

- Add multiple transactions with bonus points
- Verify cumulative tracking increases
- Check warning appears when < 1000 points remaining
- Confirm cap message when limit reached
- Test across different statement months
