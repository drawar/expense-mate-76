-- Add logo scale column for per-logo size adjustment
ALTER TABLE reward_currencies
  ADD COLUMN IF NOT EXISTS logo_scale DECIMAL(3,2) DEFAULT 0.85;

-- Set Aeroplan to smaller scale
UPDATE reward_currencies
SET logo_scale = 0.65
WHERE code = 'aeroplan';

COMMENT ON COLUMN reward_currencies.logo_scale IS 'Scale factor for logo display (0.0-1.0, default 0.85)';
