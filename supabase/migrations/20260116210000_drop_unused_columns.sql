-- Migration: Drop unused columns from reward_rules and points_balances
--
-- These columns have been replaced by newer implementations:
-- - card_type_id -> card_catalog_id (UUID FK) in reward_rules
-- - card_type_id -> payment_method_id (UUID FK) in points_balances
-- - Legacy condition columns -> conditions JSON field
-- - monthly_bonus_cap -> monthly_cap

-- ============================================================================
-- reward_rules: Drop deprecated columns
-- ============================================================================

-- Drop card_type_id (replaced by card_catalog_id UUID FK)
ALTER TABLE reward_rules DROP COLUMN IF EXISTS card_type_id;

-- Drop legacy cap/spend columns (replaced by monthly_cap, monthly_min_spend)
ALTER TABLE reward_rules DROP COLUMN IF EXISTS monthly_bonus_cap;
ALTER TABLE reward_rules DROP COLUMN IF EXISTS min_spend;
ALTER TABLE reward_rules DROP COLUMN IF EXISTS max_bonus_per_transaction;
ALTER TABLE reward_rules DROP COLUMN IF EXISTS qualifying_period_days;

-- Drop legacy category/merchant columns (replaced by conditions JSON)
ALTER TABLE reward_rules DROP COLUMN IF EXISTS excluded_categories;
ALTER TABLE reward_rules DROP COLUMN IF EXISTS included_categories;
ALTER TABLE reward_rules DROP COLUMN IF EXISTS excluded_merchants;
ALTER TABLE reward_rules DROP COLUMN IF EXISTS included_merchants;

-- Drop promo_start_date (consolidated into valid_from for promotional periods)
ALTER TABLE reward_rules DROP COLUMN IF EXISTS promo_start_date;

-- ============================================================================
-- points_balances: Drop deprecated columns
-- ============================================================================

-- Drop card_type_id (replaced by payment_method_id UUID FK)
ALTER TABLE points_balances DROP COLUMN IF EXISTS card_type_id;

-- ============================================================================
-- Summary of dropped columns:
-- ============================================================================
-- reward_rules:
--   - card_type_id (TEXT) -> use card_catalog_id (UUID)
--   - monthly_bonus_cap -> use monthly_cap
--   - min_spend -> use monthly_min_spend
--   - max_bonus_per_transaction (unused)
--   - qualifying_period_days (unused)
--   - excluded_categories -> use conditions JSON
--   - included_categories -> use conditions JSON
--   - excluded_merchants -> use conditions JSON
--   - included_merchants -> use conditions JSON
--   - promo_start_date -> use valid_from for promotional periods
--
-- points_balances:
--   - card_type_id (TEXT) -> use payment_method_id (UUID)
