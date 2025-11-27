# Type Mapping Fixes - Task 1.4

## Summary

Fixed type mapping between application and database for reward rules by:

1. Adding missing database columns via migration
2. Updating DbRewardRule type definition to match actual schema
3. Enhancing RuleMapper with better error handling and type safety
4. Updating tests to match new API

## Changes Made

### 1. Database Migration

**File:** `supabase/migrations/20251125000000_add_reward_rules_fields.sql`

Added missing columns to `reward_rules` table:

- `calculation_method` (text, default 'standard')
- `base_multiplier` (numeric, default 1)
- `bonus_multiplier` (numeric, default 0)
- `points_rounding_strategy` (text, default 'nearest')
- `amount_rounding_strategy` (text, default 'floor')
- `block_size` (numeric, default 1)
- `monthly_cap` (numeric, nullable)
- `monthly_min_spend` (numeric, nullable)
- `monthly_spend_period_type` (text, nullable)
- `points_currency` (text, default 'points')

### 2. Type Definition Updates

**File:** `src/core/rewards/types.ts`

Updated `DbRewardRule` interface to:

- Match actual database schema with proper null types
- Include all new fields
- Keep legacy fields for backward compatibility
- Add comprehensive documentation

### 3. RuleMapper Enhancements

**File:** `src/core/rewards/RuleMapper.ts`

Improved mapping logic:

- Added safe JSON parsing with error handling
- Added numeric field parsing with defaults
- Proper null handling for optional fields
- Better type casting with explicit types
- Comprehensive JSDoc comments

### 4. Test Updates

**File:** `tests/RuleRepository.test.ts`

Updated tests to:

- Use current RuleRepository API (getInstance, createRule, updateRule,
  deleteRule)
- Include all required fields in mock data
- Use RuleMapper class instead of standalone function
- Test actual repository methods

## Field Mapping

### Application → Database

| Application Field             | Database Column           | Type    | Default    |
| ----------------------------- | ------------------------- | ------- | ---------- |
| reward.calculationMethod      | calculation_method        | text    | 'standard' |
| reward.baseMultiplier         | base_multiplier           | numeric | 1          |
| reward.bonusMultiplier        | bonus_multiplier          | numeric | 0          |
| reward.pointsRoundingStrategy | points_rounding_strategy  | text    | 'nearest'  |
| reward.amountRoundingStrategy | amount_rounding_strategy  | text    | 'floor'    |
| reward.blockSize              | block_size                | numeric | 1          |
| reward.monthlyCap             | monthly_cap               | numeric | null       |
| reward.monthlyMinSpend        | monthly_min_spend         | numeric | null       |
| reward.monthlySpendPeriodType | monthly_spend_period_type | text    | null       |
| reward.pointsCurrency         | points_currency           | text    | 'points'   |

## Validation

All tests passing:

- ✅ RuleRepository.test.ts (5 tests)
- ✅ RuleRepository.connection.test.ts (4 tests)
- ✅ No TypeScript diagnostics errors

## Requirements Validated

- ✅ **1.5**: Reward rules correctly map between database schema and application
  types
- ✅ **4.1**: Database records are retrieved and mapped to application types
  correctly
- ✅ **4.2**: Database records are persisted with correct type mapping
- ✅ **11.4**: Data format matches the database schema exactly
