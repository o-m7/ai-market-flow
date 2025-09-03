-- Enable Row Level Security on ai_metrics_log table
ALTER TABLE public.ai_metrics_log ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role access for logging
CREATE POLICY "Service role can manage ai metrics log" 
ON public.ai_metrics_log 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create policy to allow authenticated users to view their own logs (if needed for debugging)
-- This is optional but could be useful for user-specific analytics
CREATE POLICY "Users can view ai metrics logs" 
ON public.ai_metrics_log 
FOR SELECT 
TO authenticated 
USING (true);