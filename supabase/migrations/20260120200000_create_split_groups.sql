-- Create split_groups table for linking split payment transactions
CREATE TABLE split_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount NUMERIC(10, 2) NOT NULL,
  total_currency TEXT NOT NULL,
  merchant_id UUID REFERENCES merchants(id),
  date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE split_groups ENABLE ROW LEVEL SECURITY;

-- Users can only access their own split groups
CREATE POLICY "Users can manage own split groups" ON split_groups
  FOR ALL USING (auth.uid() = user_id);

-- Index for efficient querying by user and date
CREATE INDEX idx_split_groups_user_date ON split_groups(user_id, date DESC);
