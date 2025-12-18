-- Migration: Convert merchants.mcc from TEXT to JSONB
-- Requirements: 3.1, 3.4

-- Step 1: Add temporary mcc_jsonb column
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS mcc_jsonb JSONB;

-- Step 2: Migrate existing TEXT data to JSONB format
-- Handle valid JSON strings and convert them to JSONB
UPDATE public.merchants
SET mcc_jsonb = 
  CASE 
    -- If mcc is already valid JSON, convert it
    WHEN mcc IS NOT NULL AND mcc != '' AND mcc::text ~ '^\s*\{.*\}\s*$' THEN
      mcc::jsonb
    -- If mcc is a simple string (like just a code), wrap it in a JSON object
    WHEN mcc IS NOT NULL AND mcc != '' THEN
      jsonb_build_object('code', mcc, 'description', '')
    -- Otherwise leave as NULL
    ELSE NULL
  END
WHERE mcc_jsonb IS NULL;

-- Step 3: Drop old mcc TEXT column
ALTER TABLE public.merchants
DROP COLUMN IF EXISTS mcc;

-- Step 4: Rename mcc_jsonb to mcc
ALTER TABLE public.merchants
RENAME COLUMN mcc_jsonb TO mcc;

-- Add comment to document the field
COMMENT ON COLUMN public.merchants.mcc IS 'Merchant Category Code stored as JSONB with code and description properties';
