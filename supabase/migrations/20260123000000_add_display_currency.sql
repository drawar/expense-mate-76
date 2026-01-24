-- Add display_currency column to user_preferences
-- This is the currency used for displaying dashboard data (separate from default_currency for new transactions)
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS display_currency TEXT NOT NULL DEFAULT 'CAD';
