-- Create table for storing conversion rates between reward currencies and miles programs
CREATE TABLE IF NOT EXISTS conversion_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_currency TEXT NOT NULL,
  miles_currency TEXT NOT NULL,
  conversion_rate DECIMAL(10, 4) NOT NULL CHECK (conversion_rate > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to ensure one rate per reward/miles currency pair
  UNIQUE(reward_currency, miles_currency)
);

-- Create index for fast lookups by reward currency and miles currency
CREATE INDEX IF NOT EXISTS idx_conversion_rates_lookup 
  ON conversion_rates(reward_currency, miles_currency);

-- Create index for fast lookups by reward currency only (for getting all rates for a currency)
CREATE INDEX IF NOT EXISTS idx_conversion_rates_reward_currency 
  ON conversion_rates(reward_currency);

-- Enable RLS
ALTER TABLE conversion_rates ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to view conversion rates
CREATE POLICY "Conversion rates are viewable by authenticated users"
  ON conversion_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to insert conversion rates
CREATE POLICY "Conversion rates are insertable by authenticated users"
  ON conversion_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to update conversion rates
CREATE POLICY "Conversion rates are updatable by authenticated users"
  ON conversion_rates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy for authenticated users to delete conversion rates
CREATE POLICY "Conversion rates are deletable by authenticated users"
  ON conversion_rates
  FOR DELETE
  TO authenticated
  USING (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_conversion_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversion_rates_updated_at
  BEFORE UPDATE ON conversion_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_conversion_rates_updated_at();
