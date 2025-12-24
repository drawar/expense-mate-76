-- Create card_catalog table for universal credit card definitions
-- This table is shared across all users (no user_id column)

CREATE TABLE IF NOT EXISTS card_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Card identification (matches reward_rules.card_type_id format)
  card_type_id TEXT NOT NULL UNIQUE,

  -- Card properties
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  network TEXT,  -- visa, mastercard, amex, discover
  currency TEXT NOT NULL DEFAULT 'SGD',

  -- Reward currency
  points_currency TEXT,
  reward_currency_id UUID REFERENCES reward_currencies(id) ON DELETE SET NULL,

  -- Display properties
  default_image_url TEXT,
  default_color TEXT,
  default_icon TEXT,

  -- Region (for filtering)
  region TEXT NOT NULL DEFAULT 'SG',

  -- Category selection support (for cards like UOB Lady's Solitaire)
  has_categories BOOLEAN DEFAULT false,
  available_categories TEXT[],
  max_categories_selectable INTEGER,

  -- Lifecycle
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_card_catalog_card_type_id ON card_catalog(card_type_id);
CREATE INDEX IF NOT EXISTS idx_card_catalog_region ON card_catalog(region);
CREATE INDEX IF NOT EXISTS idx_card_catalog_issuer ON card_catalog(issuer);
CREATE INDEX IF NOT EXISTS idx_card_catalog_active ON card_catalog(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE card_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read the catalog (shared resource)
CREATE POLICY "Allow authenticated read access to card_catalog"
  ON card_catalog FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policy: Allow anon users to read as well (for unauthenticated browsing)
CREATE POLICY "Allow anon read access to card_catalog"
  ON card_catalog FOR SELECT
  TO anon
  USING (true);

-- Note: Write access is restricted to service role only (admin operations)
-- No INSERT/UPDATE/DELETE policies for authenticated/anon users

-- Add comments
COMMENT ON TABLE card_catalog IS 'Universal catalog of credit card definitions shared across all users';
COMMENT ON COLUMN card_catalog.card_type_id IS 'Unique identifier matching reward_rules.card_type_id format: {issuer}-{name} (lowercase, hyphenated)';
COMMENT ON COLUMN card_catalog.network IS 'Card network: visa, mastercard, amex, discover';
COMMENT ON COLUMN card_catalog.region IS 'Geographic region: SG (Singapore), CA (Canada), US (United States), etc.';
COMMENT ON COLUMN card_catalog.has_categories IS 'Whether this card allows user-selectable bonus categories';
COMMENT ON COLUMN card_catalog.available_categories IS 'Array of category names available for selection (when has_categories is true)';
COMMENT ON COLUMN card_catalog.max_categories_selectable IS 'Maximum number of categories user can select (when has_categories is true)';
