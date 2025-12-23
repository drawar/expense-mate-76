-- Fix RLS to ensure user data isolation
-- This migration forcefully resets RLS policies to prevent cross-user data access

-- Step 1: Drop all existing policies on user tables
DO $$
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on payment_methods
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'payment_methods' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_methods', pol.policyname);
    END LOOP;

    -- Drop all policies on transactions
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'transactions' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.transactions', pol.policyname);
    END LOOP;

    -- Drop all policies on points_movements
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'points_movements' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.points_movements', pol.policyname);
    END LOOP;

    -- Drop all policies on bonus_points_tracking
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'bonus_points_tracking' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.bonus_points_tracking', pol.policyname);
    END LOOP;

    -- Drop all policies on email_expense_log
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'email_expense_log' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.email_expense_log', pol.policyname);
    END LOOP;
END
$$;

-- Step 2: Ensure RLS is enabled on all user tables
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_points_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_expense_log ENABLE ROW LEVEL SECURITY;

-- Step 3: Force RLS for table owners too (prevents service role bypass in some cases)
ALTER TABLE public.payment_methods FORCE ROW LEVEL SECURITY;
ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.points_movements FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_points_tracking FORCE ROW LEVEL SECURITY;
ALTER TABLE public.email_expense_log FORCE ROW LEVEL SECURITY;

-- Step 4: Create strict RLS policies for payment_methods
CREATE POLICY "payment_methods_select_own"
  ON public.payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "payment_methods_insert_own"
  ON public.payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_methods_update_own"
  ON public.payment_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_methods_delete_own"
  ON public.payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 5: Create strict RLS policies for transactions
CREATE POLICY "transactions_select_own"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 6: Create strict RLS policies for points_movements
CREATE POLICY "points_movements_select_own"
  ON public.points_movements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "points_movements_insert_own"
  ON public.points_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "points_movements_update_own"
  ON public.points_movements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "points_movements_delete_own"
  ON public.points_movements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 7: Create strict RLS policies for bonus_points_tracking
CREATE POLICY "bonus_points_tracking_select_own"
  ON public.bonus_points_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bonus_points_tracking_insert_own"
  ON public.bonus_points_tracking FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bonus_points_tracking_update_own"
  ON public.bonus_points_tracking FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bonus_points_tracking_delete_own"
  ON public.bonus_points_tracking FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 8: Create strict RLS policies for email_expense_log
CREATE POLICY "email_expense_log_select_own"
  ON public.email_expense_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "email_expense_log_insert_own"
  ON public.email_expense_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_expense_log_update_own"
  ON public.email_expense_log FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_expense_log_delete_own"
  ON public.email_expense_log FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Verify: List all policies to confirm
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been reset and enforced for user data isolation';
END
$$;
