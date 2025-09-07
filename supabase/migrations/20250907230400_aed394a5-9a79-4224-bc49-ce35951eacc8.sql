-- Fix security issue: Remove overly permissive policy that allows all users to view AI metrics
-- This table contains sensitive AI input/output data and system metadata that should not be publicly accessible

DROP POLICY IF EXISTS "Users can view ai metrics logs" ON public.ai_metrics_log;

-- Keep only the service role policy for system logging
-- The existing "Service role can manage ai metrics log" policy is sufficient for the system to log metrics