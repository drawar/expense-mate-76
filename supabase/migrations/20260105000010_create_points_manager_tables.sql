-- Migration: Create Points Manager tables
--
-- This migration creates tables for the Points Manager feature:
-- 1. points_balances - Track current/starting balance per currency per user
-- 2. points_adjustments - Manual adjustments (bonuses, corrections, etc.)
-- 3. points_redemptions - Redemption records with flight details
-- 4. points_transfers - Transfers between reward programs
-- 5. points_goals - Redemption goals tracking

-- ============================================================================
-- TABLE 1: points_balances
-- ============================================================================
-- Tracks current and starting balance per currency per user (hybrid balance mode)

CREATE TABLE IF NOT EXISTS points_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_currency_id UUID NOT NULL REFERENCES reward_currencies(id) ON DELETE CASCADE,

  -- Balance tracking
  starting_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, reward_currency_id)
);

-- RLS Policies for points_balances
ALTER TABLE points_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balances"
  ON points_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balances"
  ON points_balances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own balances"
  ON points_balances FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own balances"
  ON points_balances FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for points_balances
CREATE INDEX IF NOT EXISTS idx_points_balances_user_currency
  ON points_balances(user_id, reward_currency_id);
CREATE INDEX IF NOT EXISTS idx_points_balances_updated
  ON points_balances(updated_at);

-- ============================================================================
-- TABLE 2: points_adjustments
-- ============================================================================
-- Manual adjustments (bonuses, corrections, expired points, etc.)

CREATE TABLE IF NOT EXISTS points_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_currency_id UUID NOT NULL REFERENCES reward_currencies(id) ON DELETE CASCADE,

  -- Adjustment details
  amount NUMERIC NOT NULL, -- Positive for additions, negative for deductions
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('bonus', 'correction', 'expired', 'promotional', 'other')),
  description TEXT NOT NULL,
  reference_number TEXT, -- External reference (e.g., bonus claim number)

  -- Timestamps
  adjustment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- RLS Policies for points_adjustments
ALTER TABLE points_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adjustments"
  ON points_adjustments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adjustments"
  ON points_adjustments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adjustments"
  ON points_adjustments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own adjustments"
  ON points_adjustments FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for points_adjustments
CREATE INDEX IF NOT EXISTS idx_points_adjustments_user
  ON points_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_points_adjustments_currency
  ON points_adjustments(reward_currency_id);
CREATE INDEX IF NOT EXISTS idx_points_adjustments_date
  ON points_adjustments(adjustment_date);
CREATE INDEX IF NOT EXISTS idx_points_adjustments_not_deleted
  ON points_adjustments(user_id) WHERE is_deleted = FALSE;

-- ============================================================================
-- TABLE 3: points_redemptions
-- ============================================================================
-- Redemption records with flight-specific fields and CPP calculation

CREATE TABLE IF NOT EXISTS points_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_currency_id UUID NOT NULL REFERENCES reward_currencies(id) ON DELETE CASCADE,

  -- Redemption details
  points_redeemed NUMERIC NOT NULL CHECK (points_redeemed > 0),
  redemption_type TEXT NOT NULL CHECK (redemption_type IN ('flight', 'hotel', 'merchandise', 'cash_back', 'statement_credit', 'transfer_out', 'other')),
  description TEXT NOT NULL,

  -- Flight-specific fields (nullable, only for flight redemptions)
  flight_route TEXT, -- e.g., "SIN-NRT" or "YYZ-LHR-SIN"
  cabin_class TEXT CHECK (cabin_class IS NULL OR cabin_class IN ('economy', 'premium_economy', 'business', 'first')),
  airline TEXT, -- Operating carrier
  booking_reference TEXT,
  passengers INTEGER DEFAULT 1, -- Number of passengers on award

  -- CPP Calculation
  cash_value NUMERIC, -- Cash equivalent value
  cash_value_currency TEXT DEFAULT 'USD', -- Currency of cash value
  cpp NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN points_redeemed > 0 AND cash_value > 0
      THEN ROUND((cash_value / points_redeemed) * 100, 2)
      ELSE NULL
    END
  ) STORED, -- Cents per point, auto-calculated

  -- Timestamps
  redemption_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  travel_date TIMESTAMPTZ, -- For flights/hotels, the actual travel date
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- RLS Policies for points_redemptions
ALTER TABLE points_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON points_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions"
  ON points_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own redemptions"
  ON points_redemptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own redemptions"
  ON points_redemptions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for points_redemptions
CREATE INDEX IF NOT EXISTS idx_points_redemptions_user
  ON points_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_redemptions_currency
  ON points_redemptions(reward_currency_id);
CREATE INDEX IF NOT EXISTS idx_points_redemptions_date
  ON points_redemptions(redemption_date);
CREATE INDEX IF NOT EXISTS idx_points_redemptions_type
  ON points_redemptions(redemption_type);
CREATE INDEX IF NOT EXISTS idx_points_redemptions_not_deleted
  ON points_redemptions(user_id) WHERE is_deleted = FALSE;

-- ============================================================================
-- TABLE 4: points_transfers
-- ============================================================================
-- Transfers between reward programs (e.g., Citi ThankYou -> KrisFlyer)

CREATE TABLE IF NOT EXISTS points_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source (typically transferrable bank points)
  source_currency_id UUID NOT NULL REFERENCES reward_currencies(id) ON DELETE CASCADE,
  source_amount NUMERIC NOT NULL CHECK (source_amount > 0),

  -- Destination (typically airline miles)
  destination_currency_id UUID NOT NULL REFERENCES reward_currencies(id) ON DELETE CASCADE,
  destination_amount NUMERIC NOT NULL CHECK (destination_amount > 0),

  -- Transfer details
  conversion_rate NUMERIC NOT NULL, -- Snapshot of rate at transfer time
  transfer_bonus_rate NUMERIC, -- If there was a transfer bonus (e.g., 1.25x)
  transfer_fee NUMERIC DEFAULT 0,
  transfer_fee_currency TEXT,
  reference_number TEXT,
  notes TEXT,

  -- Timestamps
  transfer_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,

  -- Constraint: Source and destination must be different
  CONSTRAINT different_currencies CHECK (source_currency_id != destination_currency_id)
);

-- RLS Policies for points_transfers
ALTER TABLE points_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transfers"
  ON points_transfers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfers"
  ON points_transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transfers"
  ON points_transfers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transfers"
  ON points_transfers FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for points_transfers
CREATE INDEX IF NOT EXISTS idx_points_transfers_user
  ON points_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transfers_source
  ON points_transfers(source_currency_id);
CREATE INDEX IF NOT EXISTS idx_points_transfers_destination
  ON points_transfers(destination_currency_id);
CREATE INDEX IF NOT EXISTS idx_points_transfers_date
  ON points_transfers(transfer_date);
CREATE INDEX IF NOT EXISTS idx_points_transfers_not_deleted
  ON points_transfers(user_id) WHERE is_deleted = FALSE;

-- ============================================================================
-- TABLE 5: points_goals
-- ============================================================================
-- Redemption goals tracking

CREATE TABLE IF NOT EXISTS points_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_currency_id UUID NOT NULL REFERENCES reward_currencies(id) ON DELETE CASCADE,

  -- Goal details
  goal_name TEXT NOT NULL,
  goal_description TEXT,
  target_points NUMERIC NOT NULL CHECK (target_points > 0),

  -- Goal metadata
  goal_type TEXT CHECK (goal_type IS NULL OR goal_type IN ('flight', 'hotel', 'merchandise', 'other')),
  priority INTEGER DEFAULT 0, -- Higher = more important
  target_date TIMESTAMPTZ, -- Optional deadline

  -- For flight goals, store additional context
  target_route TEXT, -- e.g., "YYZ-NRT"
  target_cabin TEXT CHECK (target_cabin IS NULL OR target_cabin IN ('economy', 'premium_economy', 'business', 'first')),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ
);

-- RLS Policies for points_goals
ALTER TABLE points_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON points_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON points_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON points_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON points_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for points_goals
CREATE INDEX IF NOT EXISTS idx_points_goals_user
  ON points_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_points_goals_currency
  ON points_goals(reward_currency_id);
CREATE INDEX IF NOT EXISTS idx_points_goals_status
  ON points_goals(status);
CREATE INDEX IF NOT EXISTS idx_points_goals_not_deleted
  ON points_goals(user_id) WHERE is_deleted = FALSE;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
CREATE TRIGGER points_balances_updated_at
  BEFORE UPDATE ON points_balances
  FOR EACH ROW EXECUTE FUNCTION update_points_updated_at();

CREATE TRIGGER points_adjustments_updated_at
  BEFORE UPDATE ON points_adjustments
  FOR EACH ROW EXECUTE FUNCTION update_points_updated_at();

CREATE TRIGGER points_redemptions_updated_at
  BEFORE UPDATE ON points_redemptions
  FOR EACH ROW EXECUTE FUNCTION update_points_updated_at();

CREATE TRIGGER points_transfers_updated_at
  BEFORE UPDATE ON points_transfers
  FOR EACH ROW EXECUTE FUNCTION update_points_updated_at();

CREATE TRIGGER points_goals_updated_at
  BEFORE UPDATE ON points_goals
  FOR EACH ROW EXECUTE FUNCTION update_points_updated_at();
