-- Migration: Add missing columns to transactions table
-- Requirements: 2.1, 2.2, 2.3, 2.4

-- Add base_points column (if not exists)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS base_points NUMERIC DEFAULT 0;

-- Add bonus_points column (if not exists)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS bonus_points NUMERIC DEFAULT 0;

-- Add reimbursement_amount column (if not exists)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS reimbursement_amount NUMERIC;

-- Add deleted_at column (if not exists)
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add comments to document the fields
COMMENT ON COLUMN public.transactions.base_points IS 'Base reward points earned from the transaction';
COMMENT ON COLUMN public.transactions.bonus_points IS 'Bonus reward points earned from promotions or bonus categories';
COMMENT ON COLUMN public.transactions.reimbursement_amount IS 'Amount reimbursed for this transaction';
COMMENT ON COLUMN public.transactions.deleted_at IS 'Timestamp when the transaction was soft-deleted';
