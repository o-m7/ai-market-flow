-- Create table for storing trade analyses and their outcomes
CREATE TABLE IF NOT EXISTS public.trade_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  market TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_price DECIMAL NOT NULL,
  stop_price DECIMAL NOT NULL,
  target1_price DECIMAL,
  target2_price DECIMAL,
  target3_price DECIMAL,
  current_price_at_analysis DECIMAL NOT NULL,
  confidence DECIMAL NOT NULL,
  signal_confidence_agreement INTEGER,
  overall_accuracy INTEGER,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  checked_at TIMESTAMP WITH TIME ZONE,
  outcome TEXT, -- 'TARGET_HIT', 'STOP_HIT', 'PENDING', 'EXPIRED'
  outcome_price DECIMAL,
  outcome_time TIMESTAMP WITH TIME ZONE,
  target_hit INTEGER, -- which target was hit (1, 2, or 3)
  hours_to_outcome DECIMAL,
  pnl_percentage DECIMAL
);

-- Create index for faster queries
CREATE INDEX idx_trade_analyses_symbol ON public.trade_analyses(symbol);
CREATE INDEX idx_trade_analyses_created_at ON public.trade_analyses(created_at);
CREATE INDEX idx_trade_analyses_outcome ON public.trade_analyses(outcome);
CREATE INDEX idx_trade_analyses_pending ON public.trade_analyses(created_at) WHERE outcome IS NULL OR outcome = 'PENDING';

-- Enable RLS
ALTER TABLE public.trade_analyses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (system will insert analyses)
CREATE POLICY "Allow public insert on trade_analyses"
ON public.trade_analyses
FOR INSERT
TO public
WITH CHECK (true);

-- Allow anyone to read (for displaying stats)
CREATE POLICY "Allow public read on trade_analyses"
ON public.trade_analyses
FOR SELECT
TO public
USING (true);

-- Allow service role to update (for background job)
CREATE POLICY "Allow service role update on trade_analyses"
ON public.trade_analyses
FOR UPDATE
TO service_role
USING (true);

-- Create function to calculate historical accuracy for a symbol
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