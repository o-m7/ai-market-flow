-- Fix security vulnerability in subscribers table RLS policy
-- Remove email-based access to prevent potential data theft
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Create new secure policy that only allows access via user_id
CREATE POLICY "select_own_subscription" 
ON public.subscribers 
FOR SELECT 
USING (user_id = auth.uid());

-- Ensure all existing records have proper user_id set
-- This is a safety measure in case any records exist without user_id
UPDATE public.subscribers 
SET user_id = (
  SELECT auth.uid() 
  FROM auth.users 
  WHERE auth.users.email = subscribers.email
  LIMIT 1
)
WHERE user_id IS NULL;