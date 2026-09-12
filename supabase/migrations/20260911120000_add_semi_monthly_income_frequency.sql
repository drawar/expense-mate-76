-- Extend recurring_income.frequency to include 'semi_monthly' for the
-- twice-a-month (15th + end-of-month, shifted for weekends/holidays)
-- cadence that many salaried employees are actually paid on.
--
-- Different from biweekly: semi-monthly = 24 paychecks/year (never
-- drifts across months); biweekly = 26 paychecks/year (drifts).

DO $$
DECLARE
  cons_name text;
BEGIN
  SELECT conname INTO cons_name
  FROM pg_constraint
  WHERE conrelid = 'public.recurring_income'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%frequency%';

  IF cons_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.recurring_income DROP CONSTRAINT %I',
      cons_name
    );
  END IF;
END
$$;

ALTER TABLE public.recurring_income
  ADD CONSTRAINT recurring_income_frequency_check
  CHECK (frequency IN ('biweekly', 'monthly', 'one_off', 'semi_monthly'));
