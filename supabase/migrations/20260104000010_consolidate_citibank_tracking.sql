-- Consolidate bonus_points_tracking records for Citibank shared cap
-- Sum up existing tracking from individual rules into the shared cap group

-- First, get the rule IDs that now share the cap
-- Then consolidate their tracking into the cap group ID

DO $$
DECLARE
  rec RECORD;
  rule_ids TEXT[];
  total_points NUMERIC;
BEGIN
  -- Get rule IDs for Citibank 10x rules
  SELECT array_agg(id::text) INTO rule_ids
  FROM reward_rules
  WHERE cap_group_id = 'citibank-rewards-10x-cap';

  RAISE NOTICE 'Found rule IDs: %', rule_ids;

  -- For each unique (user_id, payment_method_id, period) combination,
  -- sum up the points from individual rules and create a consolidated record
  FOR rec IN
    SELECT DISTINCT
      user_id,
      payment_method_id,
      period_type,
      period_year,
      period_month,
      statement_day
    FROM bonus_points_tracking
    WHERE rule_id = ANY(rule_ids)
  LOOP
    -- Calculate total points from all matching rules
    SELECT COALESCE(SUM(used_bonus_points), 0) INTO total_points
    FROM bonus_points_tracking
    WHERE user_id = rec.user_id
      AND payment_method_id = rec.payment_method_id
      AND period_type = rec.period_type
      AND period_year = rec.period_year
      AND period_month = rec.period_month
      AND statement_day = rec.statement_day
      AND rule_id = ANY(rule_ids);

    -- Insert/update the consolidated record with cap group ID
    INSERT INTO bonus_points_tracking (
      user_id,
      rule_id,
      payment_method_id,
      period_type,
      period_year,
      period_month,
      statement_day,
      used_bonus_points
    ) VALUES (
      rec.user_id,
      'citibank-rewards-10x-cap',
      rec.payment_method_id,
      rec.period_type,
      rec.period_year,
      rec.period_month,
      rec.statement_day,
      total_points
    )
    ON CONFLICT (user_id, rule_id, payment_method_id, period_type, period_year, period_month, statement_day)
    DO UPDATE SET used_bonus_points = EXCLUDED.used_bonus_points;

    RAISE NOTICE 'Consolidated % points for user % payment_method % period %/%',
      total_points, rec.user_id, rec.payment_method_id, rec.period_year, rec.period_month;
  END LOOP;
END $$;
