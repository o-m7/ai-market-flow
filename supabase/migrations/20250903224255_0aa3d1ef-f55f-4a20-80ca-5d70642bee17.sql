-- Create table for AI metrics logging (for walk-forward analysis)
CREATE TABLE IF NOT EXISTS public.ai_metrics_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,           -- 'ai_analysis', 'news_gate', etc.
  input JSONB NOT NULL,         -- Input payload to the function
  output JSONB,                 -- Output from the function
  metadata JSONB DEFAULT '{}',  -- Additional metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_metrics_log_type_created_at 
ON public.ai_metrics_log(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_metrics_log_created_at 
ON public.ai_metrics_log(created_at DESC);