-- Create merchants table
CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  mcc TEXT,
  is_online BOOLEAN DEFAULT false,
  coordinates JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment_methods table
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  issuer TEXT,
  last_four_digits TEXT,
  currency TEXT DEFAULT 'USD',
  icon TEXT,
  color TEXT,
  image_url TEXT,
  network TEXT,
  credit_limit NUMERIC,
  billing_cycle_day INTEGER,
  annual_fee NUMERIC DEFAULT 0,
  interest_rate NUMERIC,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  merchant_id UUID REFERENCES public.merchants(id),
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method_id UUID REFERENCES public.payment_methods(id),
  payment_amount NUMERIC,
  payment_currency TEXT,
  total_points NUMERIC DEFAULT 0,
  category TEXT,
  notes TEXT,
  is_contactless BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merchants (public read, authenticated write)
CREATE POLICY "Anyone can view merchants"
  ON public.merchants FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert merchants"
  ON public.merchants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update merchants"
  ON public.merchants FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for payment_methods
CREATE POLICY "Users can view their own payment methods"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON public.payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON public.payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX idx_transactions_merchant_id ON public.transactions(merchant_id);
CREATE INDEX idx_transactions_payment_method_id ON public.transactions(payment_method_id);