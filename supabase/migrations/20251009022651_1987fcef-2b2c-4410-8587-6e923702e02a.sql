-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the check-trade-outcomes function to run every hour
SELECT cron.schedule(
  'check-trade-outcomes-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url:='https://ifetofkhyblyijghuwzs.supabase.co/functions/v1/check-trade-outcomes',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmZXRvZmtoeWJseWlqZ2h1d3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNTIyNTEsImV4cCI6MjA2OTgyODI1MX0.nOzUHck9fqOxvOHPOY8FE2YzmVAX1cohmb64wS9J5MQ"}'::jsonb,
      body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) AS request_id;
  $$
);

-- Fix search_path for get_historical_accuracy function
DROP FUNCTION IF EXISTS public.get_historical_accuracy(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.get_historical_accuracy(
  p_symbol TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  symbol TEXT,
  total_analyses INTEGER,
  target_hit_count INTEGER,
  stop_hit_count INTEGER,
  pending_count INTEGER,
  accuracy_percentage DECIMAL,
  avg_hours_to_target DECIMAL,
  avg_pnl_on_wins DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p_symbol as symbol,
    COUNT(*)::INTEGER as total_analyses,
    COUNT(*) FILTER (WHERE outcome = 'TARGET_HIT')::INTEGER as target_hit_count,
    COUNT(*) FILTER (WHERE outcome = 'STOP_HIT')::INTEGER as stop_hit_count,
    COUNT(*) FILTER (WHERE outcome = 'PENDING' OR outcome IS NULL)::INTEGER as pending_count,
    CASE 
      WHEN COUNT(*) FILTER (WHERE outcome IN ('TARGET_HIT', 'STOP_HIT')) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE outcome = 'TARGET_HIT')::DECIMAL / 
                  COUNT(*) FILTER (WHERE outcome IN ('TARGET_HIT', 'STOP_HIT'))::DECIMAL * 100), 2)
      ELSE 0
    END as accuracy_percentage,
    ROUND(AVG(hours_to_outcome) FILTER (WHERE outcome = 'TARGET_HIT'), 2) as avg_hours_to_target,
    ROUND(AVG(pnl_percentage) FILTER (WHERE outcome = 'TARGET_HIT'), 2) as avg_pnl_on_wins
  FROM public.trade_analyses
  WHERE 
    trade_analyses.symbol = p_symbol
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND (outcome IS NOT NULL AND outcome != 'EXPIRED');
END;
$$;
