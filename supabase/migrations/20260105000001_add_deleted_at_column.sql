-- Add deleted_at column to transactions table for soft delete tracking
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.transactions.deleted_at IS 'Timestamp when the transaction was soft-deleted';
