-- Fix card_type_id column type from uuid to text
-- The application uses string-based card type IDs like "american express-cobalt"
-- but the column was incorrectly defined as uuid

-- First, drop existing policies
DROP POLICY IF EXISTS "Anyone can view reward rules" ON reward_rules;
DROP POLICY IF EXISTS "Authenticated users can insert reward rules" ON reward_rules;
DROP POLICY IF EXISTS "Authenticated users can update reward rules" ON reward_rules;
DROP POLICY IF EXISTS "Authenticated users can delete reward rules" ON reward_rules;

-- Change card_type_id from uuid to text
ALTER TABLE reward_rules 
ALTER COLUMN card_type_id TYPE text USING card_type_id::text;

-- Recreate policies
CREATE POLICY "Anyone can view reward rules"
  ON reward_rules FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reward rules"
  ON reward_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reward rules"
  ON reward_rules FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete reward rules"
  ON reward_rules FOR DELETE
  TO authenticated
  USING (true);

-- Add index on card_type_id for better query performance
CREATE INDEX IF NOT EXISTS idx_reward_rules_card_type_id ON reward_rules(card_type_id);

-- Add comment to document the change
COMMENT ON COLUMN reward_rules.card_type_id IS 'Card type identifier in format: {issuer}-{name} (e.g., "american express-cobalt")';
