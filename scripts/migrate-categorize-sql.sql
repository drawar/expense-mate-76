-- Migration: Auto-categorize existing transactions
-- Run this in Supabase Dashboard > SQL Editor

-- This migration sets default values for the new categorization fields
-- It marks transactions as needing review if they don't have a user_category set

-- Step 1: Set needs_review = true for transactions without a user category
UPDATE transactions
SET
  needs_review = true,
  auto_category_confidence = 0.5,
  category_suggestion_reason = 'Pending auto-categorization'
WHERE
  (is_deleted IS NOT TRUE OR is_deleted IS NULL)
  AND (user_category IS NULL OR user_category = '')
  AND (is_recategorized IS NOT TRUE OR is_recategorized IS NULL);

-- Step 2: Set needs_review = false for transactions that were manually categorized
UPDATE transactions
SET
  needs_review = false,
  auto_category_confidence = 1.0,
  category_suggestion_reason = 'User categorized'
WHERE
  (is_deleted IS NOT TRUE OR is_deleted IS NULL)
  AND is_recategorized = true
  AND user_category IS NOT NULL
  AND user_category != '';

-- Step 3: Report results
SELECT
  COUNT(*) FILTER (WHERE needs_review = true) as needs_review_count,
  COUNT(*) FILTER (WHERE needs_review = false OR needs_review IS NULL) as categorized_count,
  COUNT(*) FILTER (WHERE is_recategorized = true) as user_categorized_count,
  COUNT(*) as total_count
FROM transactions
WHERE is_deleted IS NOT TRUE OR is_deleted IS NULL;
