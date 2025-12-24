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

    -- Drop all policies on points_movements (if exists)
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'points_movements' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.points_movements', pol.policyname);
    END LOOP;

    -- Drop all policies on bonus_points_tracking (if exists)
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'bonus_points_tracking' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.bonus_points_tracking', pol.policyname);
    END LOOP;

    -- Drop all policies on email_expense_log (if exists)
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'email_expense_log' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.email_expense_log', pol.policyname);
    END LOOP;
END
$$;

-- Step 2: Enable RLS on tables that exist
DO $$
BEGIN
    -- payment_methods
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
        ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.payment_methods FORCE ROW LEVEL SECURITY;
    END IF;

    -- transactions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.transactions FORCE ROW LEVEL SECURITY;
    END IF;

    -- bonus_points_tracking
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bonus_points_tracking') THEN
        ALTER TABLE public.bonus_points_tracking ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.bonus_points_tracking FORCE ROW LEVEL SECURITY;
    END IF;

    -- points_movements
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points_movements') THEN
        ALTER TABLE public.points_movements ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.points_movements FORCE ROW LEVEL SECURITY;
    END IF;

    -- email_expense_log
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_expense_log') THEN
        ALTER TABLE public.email_expense_log ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.email_expense_log FORCE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Step 3: Create strict RLS policies for payment_methods (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
        EXECUTE 'CREATE POLICY "payment_methods_select_own" ON public.payment_methods FOR SELECT TO authenticated USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "payment_methods_insert_own" ON public.payment_methods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "payment_methods_update_own" ON public.payment_methods FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "payment_methods_delete_own" ON public.payment_methods FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- Step 4: Create strict RLS policies for transactions (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
        EXECUTE 'CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "transactions_update_own" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "transactions_delete_own" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- Step 5: Create strict RLS policies for points_movements (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'points_movements') THEN
        EXECUTE 'CREATE POLICY "points_movements_select_own" ON public.points_movements FOR SELECT TO authenticated USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "points_movements_insert_own" ON public.points_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "points_movements_update_own" ON public.points_movements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "points_movements_delete_own" ON public.points_movements FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- Step 6: Create strict RLS policies for bonus_points_tracking (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bonus_points_tracking') THEN
        EXECUTE 'CREATE POLICY "bonus_points_tracking_select_own" ON public.bonus_points_tracking FOR SELECT TO authenticated USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "bonus_points_tracking_insert_own" ON public.bonus_points_tracking FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "bonus_points_tracking_update_own" ON public.bonus_points_tracking FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "bonus_points_tracking_delete_own" ON public.bonus_points_tracking FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- Step 7: Create strict RLS policies for email_expense_log (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_expense_log') THEN
        EXECUTE 'CREATE POLICY "email_expense_log_select_own" ON public.email_expense_log FOR SELECT TO authenticated USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "email_expense_log_insert_own" ON public.email_expense_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "email_expense_log_update_own" ON public.email_expense_log FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "email_expense_log_delete_own" ON public.email_expense_log FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
END
$$;

-- Verify: List all policies to confirm
DO $$
BEGIN
  RAISE NOTICE 'RLS policies have been reset and enforced for user data isolation';
END
$$;
