-- Nightly cron for the end-of-cycle settlement Edge Function.
--
-- Mirrors the monthly-spending-summary cron setup (see
-- 20260101000000_create_monthly_summary_cron.sql). Requires the
-- pg_cron and pg_net extensions plus a `service_role_key` entry in
-- vault.decrypted_secrets — both already provisioned by that earlier
-- migration.
--
-- The Edge Function itself is idempotent (fingerprint-guarded UPDATE),
-- so a duplicate cron fire or an overlapping lazy-client trigger is
-- harmless — the loser just sees 0 rows affected.
--
-- Schedule: 00:15 UTC daily. Explicitly NOT synced to any single
-- user's timezone (no user_preferences.timezone column yet) — settling
-- shortly after UTC midnight is the least-bad choice for global usage.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION call_settle_due_budget_periods()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url TEXT := 'https://yulueezoyjxobhureuxj.supabase.co';
  service_key TEXT;
BEGIN
  SELECT decrypted_secret INTO service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key'
  LIMIT 1;

  IF service_key IS NULL THEN
    RAISE NOTICE 'service_role_key not found in vault. Skipping settle-due-budget-periods run.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/settle-due-budget-periods',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule at 00:15 UTC daily. Manual command to run in the SQL editor
-- after this migration lands (pg_cron requires a superuser SELECT):
--
--   SELECT cron.schedule(
--     'settle-due-budget-periods',
--     '15 0 * * *',
--     'SELECT call_settle_due_budget_periods();'
--   );
--
-- To view:      SELECT * FROM cron.job WHERE jobname = 'settle-due-budget-periods';
-- To remove:    SELECT cron.unschedule('settle-due-budget-periods');
