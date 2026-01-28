-- Add source_payment_method_id to points_transfers
-- This allows tracking which specific card/balance a transfer came from
-- when multiple cards earn the same reward currency

ALTER TABLE points_transfers
ADD COLUMN source_payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_points_transfers_source_payment_method
  ON points_transfers(source_payment_method_id)
  WHERE source_payment_method_id IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN points_transfers.source_payment_method_id IS
  'Optional: Links transfer to specific payment method/card when user has multiple cards earning same currency';
