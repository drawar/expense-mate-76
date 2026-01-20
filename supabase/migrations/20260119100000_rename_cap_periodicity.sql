-- Rename monthly_spend_period_type to cap_periodicity and update values
-- Old values: calendar, statement_month, promotional
-- New values: calendar_month, statement_month (unchanged), promotional_period

-- Step 1: Rename the column in reward_rules
ALTER TABLE reward_rules
RENAME COLUMN monthly_spend_period_type TO cap_periodicity;

-- Step 2: Update the values in reward_rules
UPDATE reward_rules SET cap_periodicity = 'calendar_month' WHERE cap_periodicity = 'calendar';
UPDATE reward_rules SET cap_periodicity = 'promotional_period' WHERE cap_periodicity = 'promotional';
-- statement_month remains unchanged

-- Step 3: Drop the check constraint on bonus_points_tracking.period_type
ALTER TABLE bonus_points_tracking DROP CONSTRAINT IF EXISTS bonus_points_tracking_period_type_check;

-- Step 4: Update the values in bonus_points_tracking
UPDATE bonus_points_tracking SET period_type = 'calendar_month' WHERE period_type = 'calendar';
UPDATE bonus_points_tracking SET period_type = 'promotional_period' WHERE period_type = 'promotional';

-- Step 5: Add new check constraint with updated values
ALTER TABLE bonus_points_tracking ADD CONSTRAINT bonus_points_tracking_period_type_check
  CHECK (period_type IN ('calendar_month', 'statement', 'statement_month', 'promotional_period'));
