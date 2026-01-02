-- Monthly Spending Summary Cron Job Setup
--
-- Option 1: Using Supabase Dashboard (Recommended)
-- Go to: Database > Extensions > Enable pg_cron
-- Then: SQL Editor > Run the schedule command below
--
-- Option 2: Using external cron service (e.g., cron-job.org, GitHub Actions)
-- Call: POST https://yulueezoyjxobhureuxj.supabase.co/functions/v1/monthly-spending-summary
-- With: Authorization: Bearer <service_role_key>

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to call the Edge Function
CREATE OR REPLACE FUNCTION call_monthly_spending_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url TEXT := 'https://yulueezoyjxobhureuxj.supabase.co';
  service_key TEXT;
BEGIN
  -- Get the service role key from vault (if stored there)
  -- Otherwise you'll need to hardcode it or use secrets
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  -- If not in vault, you can set it manually during setup
  IF service_key IS NULL THEN
    RAISE NOTICE 'Service role key not found in vault. Please set up manually.';
    RETURN;
  END IF;

  -- Call the Edge Function
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/monthly-spending-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule: Runs at 9:00 AM UTC on the 1st of every month
-- Note: You may need to run this manually in the SQL editor after enabling pg_cron
-- SELECT cron.schedule(
--   'monthly-spending-summary',
--   '0 9 1 * *',
--   'SELECT call_monthly_spending_summary();'
-- );

-- To view scheduled jobs: SELECT * FROM cron.job;
-- To unschedule: SELECT cron.unschedule('monthly-spending-summary');
