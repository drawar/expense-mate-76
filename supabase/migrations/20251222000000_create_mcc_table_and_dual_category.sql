-- Migration: Create MCC reference table and dual-category system
-- This migration:
-- 1. Creates a normalized MCC reference table
-- 2. Adds mcc_code column to merchants (replacing JSONB)
-- 3. Adds category columns to transactions (mcc_code, user_category, is_recategorized)

-- ============================================
-- PHASE 1: Create MCC Reference Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.mcc (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL
);

-- Note: The MCC table will be populated by the seeding script (scripts/seed-mcc-table.ts)
-- which contains all 541 standard MCC codes

-- Add RLS policy (public read access - MCC codes are not user-specific)
ALTER TABLE mcc ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "MCC codes are publicly readable" ON mcc;
CREATE POLICY "MCC codes are publicly readable"
  ON mcc FOR SELECT
  USING (true);

-- ============================================
-- PHASE 2: Migrate Merchants Table
-- ============================================

-- Add new mcc_code column (simple TEXT, no FK initially to allow migration)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS mcc_code TEXT;

-- Backfill mcc_code from existing mcc column
-- Handle both JSONB format (mcc->>'code') and TEXT format
DO $$
BEGIN
  -- Try JSONB extraction first
  UPDATE merchants
  SET mcc_code = mcc::jsonb->>'code'
  WHERE mcc IS NOT NULL
    AND mcc_code IS NULL
    AND mcc::text ~ '^\s*\{.*\}\s*$';
EXCEPTION WHEN OTHERS THEN
  -- If that fails, the column might already be TEXT or empty
  NULL;
END $$;

-- Note: We keep the old 'mcc' column for now for backwards compatibility
-- It can be dropped in a future migration after verifying all code uses mcc_code

-- ============================================
-- PHASE 3: Add Transaction Category Columns
-- ============================================

-- Add new category columns to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS mcc_code TEXT,
ADD COLUMN IF NOT EXISTS user_category TEXT,
ADD COLUMN IF NOT EXISTS is_recategorized BOOLEAN DEFAULT false;

-- Backfill mcc_code from merchant
UPDATE transactions t
SET mcc_code = m.mcc_code
FROM merchants m
WHERE t.merchant_id = m.id
  AND t.mcc_code IS NULL
  AND m.mcc_code IS NOT NULL;

-- Backfill user_category from existing category or MCC description
UPDATE transactions t
SET user_category = COALESCE(
  NULLIF(t.category, ''),
  mc.description,
  'Uncategorized'
)
FROM merchants m
LEFT JOIN mcc mc ON m.mcc_code = mc.code
WHERE t.merchant_id = m.id
  AND t.user_category IS NULL;

-- Handle transactions without merchant or where above didn't set user_category
UPDATE transactions
SET user_category = COALESCE(NULLIF(category, ''), 'Uncategorized')
WHERE user_category IS NULL;

-- Set is_recategorized to false for all existing transactions
UPDATE transactions
SET is_recategorized = false
WHERE is_recategorized IS NULL;
