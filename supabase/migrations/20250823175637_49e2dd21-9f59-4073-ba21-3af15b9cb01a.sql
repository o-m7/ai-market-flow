-- Create usage tracking table for free users
CREATE TABLE public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  symbol TEXT NOT NULL,
  analysis_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, analysis_date, symbol)
);

-- Enable Row Level Security
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own usage
CREATE POLICY "select_own_usage" ON public.user_usage
  FOR SELECT
  USING (user_id = auth.uid());

-- Create policy for edge functions to insert/update usage
CREATE POLICY "insert_usage" ON public.user_usage
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update_usage" ON public.user_usage
  FOR UPDATE
  USING (true);