-- Add trial columns to existing subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;