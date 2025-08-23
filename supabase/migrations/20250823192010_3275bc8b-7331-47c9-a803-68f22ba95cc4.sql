-- Insert 10 test premium accounts for testing
-- These accounts will have active premium subscriptions

INSERT INTO public.subscribers (email, subscribed, subscription_tier, subscription_end, stripe_customer_id, updated_at) VALUES
('test1@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test1', now()),
('test2@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test2', now()),
('test3@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test3', now()),
('test4@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test4', now()),
('test5@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test5', now()),
('test6@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test6', now()),
('test7@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test7', now()),
('test8@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test8', now()),
('test9@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test9', now()),
('test10@alphaedge.com', true, 'Premium', '2025-12-31 23:59:59+00', 'cus_test10', now());

-- Create a function to update user_id when users sign up with these test emails
CREATE OR REPLACE FUNCTION public.update_test_subscriber_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update subscriber record with user_id when a user signs up with a test email
  UPDATE public.subscribers 
  SET user_id = NEW.id, updated_at = now()
  WHERE email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically link test accounts when users sign up
CREATE OR REPLACE TRIGGER on_auth_user_created_test_link
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_test_subscriber_user_id();