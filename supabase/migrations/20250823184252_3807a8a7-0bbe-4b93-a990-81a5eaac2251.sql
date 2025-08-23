-- Fix critical security vulnerabilities in RLS policies
-- Prevent unauthorized inserts and updates to subscribers and user_usage tables

-- Drop existing insecure policies for subscribers table
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure INSERT policy for subscribers - only authenticated users can create records for themselves
CREATE POLICY "insert_own_subscription" 
ON public.subscribers 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create secure UPDATE policy for subscribers - only users can update their own records
CREATE POLICY "update_own_subscription" 
ON public.subscribers 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Drop existing insecure policies for user_usage table
DROP POLICY IF EXISTS "insert_usage" ON public.user_usage;
DROP POLICY IF EXISTS "update_usage" ON public.user_usage;

-- Create secure INSERT policy for user_usage - only authenticated users can create records for themselves
CREATE POLICY "insert_own_usage" 
ON public.user_usage 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create secure UPDATE policy for user_usage - only users can update their own records
CREATE POLICY "update_own_usage" 
ON public.user_usage 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());