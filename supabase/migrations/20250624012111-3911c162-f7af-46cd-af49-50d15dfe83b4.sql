
-- First, let's handle the foreign key constraints properly
-- Delete points_movements first, then transactions, then payment_methods

-- Add user_id columns to tables that need user-specific access (nullable first)
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payment_methods ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.points_movements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Clear existing data in the correct order (respecting foreign key constraints)
DELETE FROM public.points_movements;
DELETE FROM public.transactions;
DELETE FROM public.payment_methods;

-- Now make user_id required for new records
ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.payment_methods ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.points_movements ALTER COLUMN user_id SET NOT NULL;

-- Enable Row Level Security on all tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for payment_methods
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON public.payment_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON public.payment_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON public.payment_methods
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for points_movements
CREATE POLICY "Users can view their own points movements" ON public.points_movements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points movements" ON public.points_movements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points movements" ON public.points_movements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own points movements" ON public.points_movements
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for merchants (allow authenticated users to read all merchants)
CREATE POLICY "Authenticated users can view merchants" ON public.merchants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert merchants" ON public.merchants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update merchants" ON public.merchants
  FOR UPDATE TO authenticated USING (true);

-- Create profiles table for user management (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles (with IF NOT EXISTS equivalent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile') THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END
$$;

-- Add validation triggers for critical data
CREATE OR REPLACE FUNCTION public.validate_transaction_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate amount is positive
  IF NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Transaction amount must be positive';
  END IF;
  
  -- Validate payment amount is positive
  IF NEW.payment_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;
  
  -- Validate currencies are valid
  IF NEW.currency NOT IN ('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CNY', 'INR', 'SGD', 'TWD', 'VND', 'IDR', 'THB', 'MYR') THEN
    RAISE EXCEPTION 'Invalid currency: %', NEW.currency;
  END IF;
  
  -- Validate date format
  IF NEW.date !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Invalid date format. Expected YYYY-MM-DD';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create validation trigger (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'validate_transaction_before_insert_update') THEN
    CREATE TRIGGER validate_transaction_before_insert_update
      BEFORE INSERT OR UPDATE ON public.transactions
      FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_data();
  END IF;
END
$$;

-- Add audit logging
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_log' AND policyname = 'Users can view their own audit logs') THEN
    CREATE POLICY "Users can view their own audit logs" ON public.audit_log
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END
$$;
