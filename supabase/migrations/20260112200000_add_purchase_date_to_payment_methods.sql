-- Migration: Add purchase_date column to payment_methods table
-- For gift cards: stores the date the card was purchased

-- Add purchase_date column (if not exists)
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS purchase_date DATE;

-- Add comment to document the field
COMMENT ON COLUMN public.payment_methods.purchase_date IS 'For gift cards: the date the card was purchased';
