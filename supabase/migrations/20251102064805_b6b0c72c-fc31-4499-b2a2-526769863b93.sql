-- Add missing columns to payment_methods table
ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS reward_rules jsonb,
ADD COLUMN IF NOT EXISTS selected_categories jsonb,
ADD COLUMN IF NOT EXISTS statement_start_day integer,
ADD COLUMN IF NOT EXISTS is_monthly_statement boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS conversion_rate jsonb,
ADD COLUMN IF NOT EXISTS points_currency text;

-- Add missing columns to merchants table
ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- Add missing columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS base_points numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_points numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS reimbursement_amount numeric;