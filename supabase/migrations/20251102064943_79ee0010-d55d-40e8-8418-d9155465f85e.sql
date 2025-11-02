-- Create reward_rules table
CREATE TABLE IF NOT EXISTS reward_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_type_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  enabled boolean DEFAULT true,
  priority integer DEFAULT 0,
  conditions jsonb,
  bonus_tiers jsonb,
  monthly_bonus_cap numeric,
  min_spend numeric,
  max_bonus_per_transaction numeric,
  qualifying_period_days integer,
  excluded_categories text[],
  included_categories text[],
  excluded_merchants text[],
  included_merchants text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE reward_rules ENABLE ROW LEVEL SECURITY;

-- Create policies for reward_rules
CREATE POLICY "Anyone can view reward rules"
  ON reward_rules FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reward rules"
  ON reward_rules FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reward rules"
  ON reward_rules FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete reward rules"
  ON reward_rules FOR DELETE
  USING (true);