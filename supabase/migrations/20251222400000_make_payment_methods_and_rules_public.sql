-- Make payment_methods and reward_rules accessible by all authenticated users
-- payment_methods: all users can READ, but only owner can WRITE
-- reward_rules: all users can READ and WRITE (shared reference data)

-- Step 1: Drop existing policies on payment_methods
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'payment_methods' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.payment_methods', pol.policyname);
    END LOOP;
END
$$;

-- Step 2: Drop existing policies on reward_rules
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'reward_rules' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.reward_rules', pol.policyname);
    END LOOP;
END
$$;

-- Step 3: Ensure RLS is enabled
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_rules ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new policies for payment_methods
-- All authenticated users can read all payment methods
CREATE POLICY "payment_methods_select_all"
  ON public.payment_methods FOR SELECT
  TO authenticated
  USING (true);

-- Only owner can insert their own payment methods
CREATE POLICY "payment_methods_insert_own"
  ON public.payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only owner can update their own payment methods
CREATE POLICY "payment_methods_update_own"
  ON public.payment_methods FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Only owner can delete their own payment methods
CREATE POLICY "payment_methods_delete_own"
  ON public.payment_methods FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 5: Create new policies for reward_rules (shared reference data)
-- All authenticated users can read all reward rules
CREATE POLICY "reward_rules_select_all"
  ON public.reward_rules FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can insert reward rules
CREATE POLICY "reward_rules_insert_all"
  ON public.reward_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- All authenticated users can update reward rules
CREATE POLICY "reward_rules_update_all"
  ON public.reward_rules FOR UPDATE
  TO authenticated
  USING (true);

-- All authenticated users can delete reward rules
CREATE POLICY "reward_rules_delete_all"
  ON public.reward_rules FOR DELETE
  TO authenticated
  USING (true);

-- Note: Remove FORCE ROW LEVEL SECURITY from payment_methods if it was set
-- (FORCE prevents even table owners from bypassing RLS, which we don't need here)
ALTER TABLE public.payment_methods NO FORCE ROW LEVEL SECURITY;
