-- Add redemption cancellation support
-- Allows users to cancel redemptions with an audit trail instead of deleting them

-- Add cancelled_redemption_id FK column (nullable, references points_redemptions)
ALTER TABLE points_redemptions
  ADD COLUMN cancelled_redemption_id UUID REFERENCES points_redemptions(id);

-- Add is_cancelled flag
ALTER TABLE points_redemptions
  ADD COLUMN is_cancelled BOOLEAN DEFAULT FALSE;

-- Drop existing redemption_type check constraint and re-add with 'cancellation'
ALTER TABLE points_redemptions
  DROP CONSTRAINT IF EXISTS points_redemptions_redemption_type_check;

ALTER TABLE points_redemptions
  ADD CONSTRAINT points_redemptions_redemption_type_check
  CHECK (redemption_type IN ('flight', 'hotel', 'merchandise', 'cash_back', 'statement_credit', 'transfer_out', 'other', 'cancellation'));

-- Unique partial index: prevent double-cancellation of the same redemption
CREATE UNIQUE INDEX idx_unique_cancelled_redemption
  ON points_redemptions (cancelled_redemption_id)
  WHERE cancelled_redemption_id IS NOT NULL;

-- Index for FK lookups
CREATE INDEX idx_points_redemptions_cancelled_redemption_id
  ON points_redemptions (cancelled_redemption_id)
  WHERE cancelled_redemption_id IS NOT NULL;
