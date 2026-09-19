-- Add end-of-cycle behavior to budget_allocations so users can choose,
-- per parent category, whether unused budget resets at cycle end or
-- rolls forward into the next cycle.
--
-- reset    → unused budget closes out and becomes "extra available to
--            save" (never silently increases the next cycle's budget)
-- rollover → unused budget carries forward as `carry_in` on the next
--            budget_periods row; negative balances (overspend) also
--            carry as negative carry_in
--
-- Cadence + end_behavior are two independent knobs on every category:
--   monthly | reset      groceries every month reset to base
--   monthly | rollover   car maintenance accumulates until used
--   per_period | reset   dining envelope expires each pay period
--   per_period | rollover travel accrues per pay period
--
-- The savings sentinel row (parent_category_id='savings') is always
-- `reset` behavior in application code — savings is set aside at open,
-- not settled at close. The default here just keeps the column
-- NOT NULL for that row.

ALTER TABLE public.budget_allocations
  ADD COLUMN IF NOT EXISTS end_behavior TEXT NOT NULL DEFAULT 'reset';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.budget_allocations'::regclass
      AND conname = 'budget_allocations_end_behavior_check'
  ) THEN
    ALTER TABLE public.budget_allocations
      ADD CONSTRAINT budget_allocations_end_behavior_check
      CHECK (end_behavior IN ('reset', 'rollover'));
  END IF;
END
$$;
