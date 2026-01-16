-- Migration: Add foreign key columns to replace card_type_id
-- Phase 1: Add new columns (non-breaking)
--
-- This migration adds:
-- 1. card_catalog_id (UUID FK) to reward_rules
-- 2. payment_method_id (UUID FK) to points_balances
--
-- These will eventually replace the TEXT-based card_type_id columns

-- ============================================================================
-- PART 1: Add card_catalog_id to reward_rules
-- ============================================================================

ALTER TABLE reward_rules
ADD COLUMN IF NOT EXISTS card_catalog_id UUID REFERENCES card_catalog(id) ON DELETE SET NULL;

COMMENT ON COLUMN reward_rules.card_catalog_id IS 'Foreign key to card_catalog. Replaces card_type_id for reliable rule matching.';

-- Index for efficient rule lookups by card_catalog_id
CREATE INDEX IF NOT EXISTS idx_reward_rules_card_catalog_id
  ON reward_rules(card_catalog_id)
  WHERE card_catalog_id IS NOT NULL;

-- ============================================================================
-- PART 2: Add payment_method_id to points_balances
-- ============================================================================

ALTER TABLE points_balances
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;

COMMENT ON COLUMN points_balances.payment_method_id IS 'Foreign key to payment_methods for card-specific balances. Replaces card_type_id.';

-- Index for efficient balance lookups by payment_method_id
CREATE INDEX IF NOT EXISTS idx_points_balances_payment_method_id
  ON points_balances(payment_method_id)
  WHERE payment_method_id IS NOT NULL;

-- ============================================================================
-- PART 3: Backfill reward_rules.card_catalog_id from card_type_id
-- ============================================================================

-- Match reward_rules to card_catalog via card_type_id
UPDATE reward_rules r
SET card_catalog_id = c.id
FROM card_catalog c
WHERE r.card_type_id = c.card_type_id
  AND r.card_catalog_id IS NULL;

-- ============================================================================
-- PART 4: Backfill points_balances.payment_method_id from card_type_id
-- ============================================================================

-- Match points_balances to payment_methods via card_type_id pattern
-- The card_type_id format is: {issuer}-{name} (lowercase, hyphenated)
UPDATE points_balances pb
SET payment_method_id = pm.id
FROM payment_methods pm
WHERE pb.card_type_id IS NOT NULL
  AND pb.user_id = pm.user_id
  AND pb.card_type_id = LOWER(REPLACE(REPLACE(pm.issuer, ' ', '-'), '.', ''))
                     || '-'
                     || LOWER(REPLACE(REPLACE(pm.name, ' ', '-'), '.', ''))
  AND pb.payment_method_id IS NULL;
