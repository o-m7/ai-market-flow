-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on cron schema to postgres
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule hourly trade outcome checks
-- This will call the trigger-trade-checks function every hour
SELECT cron.schedule(
  'check-trade-outcomes-hourly',
  '0 * * * *',  -- Run at minute 0 of every hour
  $$
  SELECT
    net.http_post(
      url := 'https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/trigger-trade-checks',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Create a function to check the cron job status
CREATE OR REPLACE FUNCTION get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  jobname text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT * FROM cron.job WHERE jobname = 'check-trade-outcomes-hourly';
END;
$$;