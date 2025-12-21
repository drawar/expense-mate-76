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

-- Populate from existing merchant MCC data
INSERT INTO mcc (code, description)
SELECT DISTINCT mcc->>'code', mcc->>'description'
FROM merchants
WHERE mcc IS NOT NULL
  AND mcc->>'code' IS NOT NULL
  AND mcc->>'code' != ''
ON CONFLICT (code) DO NOTHING;

-- Add RLS policy (public read access - MCC codes are not user-specific)
ALTER TABLE mcc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MCC codes are publicly readable"
  ON mcc FOR SELECT
  USING (true);

-- ============================================
-- PHASE 2: Migrate Merchants Table
-- ============================================

-- Add new mcc_code column (simple TEXT, no FK initially to allow migration)
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS mcc_code TEXT;

-- Backfill mcc_code from existing JSONB
UPDATE merchants
SET mcc_code = mcc->>'code'
WHERE mcc IS NOT NULL AND mcc_code IS NULL;

-- Note: We keep the old 'mcc' JSONB column for now for backwards compatibility
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
