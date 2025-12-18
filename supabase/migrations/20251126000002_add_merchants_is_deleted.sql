-- Migration: Add is_deleted column to merchants table
-- Requirements: 3.5

-- Add is_deleted column (if not exists)
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- Add comment to document the field
COMMENT ON COLUMN public.merchants.is_deleted IS 'Soft delete flag for merchants';
