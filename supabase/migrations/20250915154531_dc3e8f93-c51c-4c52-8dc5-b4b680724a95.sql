-- First, let's insert a user directly into auth.users (this is typically handled by Supabase, but for admin setup)
-- We'll create the admin account and ensure it has proper subscriber status

-- Insert into subscribers table for admin user
INSERT INTO public.subscribers (
  email,
  subscribed,
  subscription_tier,
  trial_start,
  trial_end,
  subscription_end,
  stripe_customer_id,
  user_id
) VALUES (
  'admin@test.com', 
  true, 
  'premium_yearly', 
  now() - interval '365 days', 
  now() - interval '358 days', 
  now() + interval '10 years', 
  'cus_admin_test',
  NULL
) ON CONFLICT (email) DO UPDATE SET
  subscribed = true,
  subscription_tier = 'premium_yearly',
  subscription_end = now() + interval '10 years';

-- Also create a simple test user
INSERT INTO public.subscribers (
  email,
  subscribed,
  subscription_tier,
  trial_start,
  trial_end,
  subscription_end,
  stripe_customer_id,
  user_id
) VALUES (
  'test@test.com', 
  true, 
  'premium_monthly', 
  now() - interval '30 days', 
  now() - interval '23 days', 
  now() + interval '6 months', 
  'cus_test_user',
  NULL
) ON CONFLICT (email) DO UPDATE SET
  subscribed = true,
  subscription_tier = 'premium_monthly',
  subscription_end = now() + interval '6 months';