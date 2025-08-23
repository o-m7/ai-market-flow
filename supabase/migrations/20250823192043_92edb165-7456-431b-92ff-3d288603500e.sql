-- Fix security warning: Add search_path to function
CREATE OR REPLACE FUNCTION public.update_test_subscriber_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update subscriber record with user_id when a user signs up with a test email
  UPDATE public.subscribers 
  SET user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;