-- Fix payment_methods RLS to ensure users can only see their own payment methods
-- This reverts the "make public" change from 20251222400000 that allowed all users
-- to see all payment methods

-- Step 1: Drop the overly permissive select policy
DROP POLICY IF EXISTS "payment_methods_select_all" ON public.payment_methods;

-- Step 2: Drop any existing select_own policy (in case it exists from earlier migration)
DROP POLICY IF EXISTS "payment_methods_select_own" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can view their own payment methods" ON public.payment_methods;

-- Step 3: Create proper RLS policy - users can only SELECT their own payment methods
CREATE POLICY "payment_methods_select_own"
  ON public.payment_methods FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Verify the other policies are correct (these should already exist and be correct)
-- INSERT: Only owner can insert their own payment methods
-- UPDATE: Only owner can update their own payment methods
-- DELETE: Only owner can delete their own payment methods
