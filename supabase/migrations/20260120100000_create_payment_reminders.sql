-- Create table to track sent payment reminders
-- Prevents duplicate reminders for the same statement period

CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id) ON DELETE CASCADE,
  -- Statement period identifier (year-month format, e.g., "2026-01")
  statement_period TEXT NOT NULL,
  -- When the reminder was sent
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Email address the reminder was sent to
  sent_to_email TEXT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure only one reminder per payment method per statement period
  UNIQUE(user_id, payment_method_id, statement_period)
);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_payment_reminders_lookup
ON payment_reminders(user_id, payment_method_id, statement_period);

-- Enable RLS
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reminders
CREATE POLICY "Users can view their own payment reminders"
ON payment_reminders FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own reminders
CREATE POLICY "Users can create their own payment reminders"
ON payment_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE payment_reminders IS 'Tracks sent payment reminders to prevent duplicates';
COMMENT ON COLUMN payment_reminders.statement_period IS 'Statement period in YYYY-MM format';
