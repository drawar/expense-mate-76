-- Migration: Add total_loaded column to payment_methods table
-- For prepaid cards: stores the total amount loaded onto the card

-- Add total_loaded column (if not exists)
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS total_loaded NUMERIC;

-- Add comment to document the field
COMMENT ON COLUMN public.payment_methods.total_loaded IS 'For prepaid cards: total amount loaded onto the card. Card is auto-deactivated when balance (total_loaded - total_spent) reaches 0.';
