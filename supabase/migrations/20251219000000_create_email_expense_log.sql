-- Create email_expense_log table to track email-based expense submissions
CREATE TABLE IF NOT EXISTS public.email_expense_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  subject TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processed', 'failed', 'rejected')),
  error_message TEXT,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  raw_email_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX idx_email_expense_log_user_id ON public.email_expense_log(user_id);

-- Index for status filtering
CREATE INDEX idx_email_expense_log_status ON public.email_expense_log(status);

-- Index for email lookup (for rejected email tracking)
CREATE INDEX idx_email_expense_log_from_email ON public.email_expense_log(from_email);

-- Enable Row Level Security
ALTER TABLE public.email_expense_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own email expense logs
CREATE POLICY "Users can view their own email expense logs"
  ON public.email_expense_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow insert for service role (webhook uses service role key)
-- No policy needed for INSERT as service role bypasses RLS
