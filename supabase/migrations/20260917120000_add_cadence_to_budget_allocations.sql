-- Add per-category cadence to budget_allocations so users can flag
-- categories with big lumpy monthly costs (rent, mortgage, car loan,
-- insurance) as `monthly` while keeping discretionary categories on
-- `per_period` cadence.
--
-- The display layer:
--   per_period → budget/spent scoped to the active pay-period window
--   monthly    → budget = sum across all pay-periods in the calendar month
--                spent  = sum of category's transactions in [month_start, month_end]
-- The snapshot values in budget_periods.allocations stay per-period
-- regardless of cadence — only the display aggregation changes.

ALTER TABLE public.budget_allocations
  ADD COLUMN IF NOT EXISTS cadence TEXT NOT NULL DEFAULT 'per_period';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.budget_allocations'::regclass
      AND conname = 'budget_allocations_cadence_check'
  ) THEN
    ALTER TABLE public.budget_allocations
      ADD CONSTRAINT budget_allocations_cadence_check
      CHECK (cadence IN ('per_period', 'monthly'));
  END IF;
END
$$;
